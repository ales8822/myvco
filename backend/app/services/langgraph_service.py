import logging
import os
from typing import TypedDict, Annotated, Sequence, List
from dotenv import load_dotenv

# LangGraph and LangChain imports
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, AIMessage
from langgraph.graph.message import add_messages
from langchain_core.tools import tool
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_genai import ChatGoogleGenerativeAI 

logger = logging.getLogger(__name__)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=env_path)

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    next_speaker: str
    meeting_id: int
    target_path: str

def get_workspace_tools(target_path: str) -> List:
    def get_safe_path(requested_path: str) -> str:
        if not target_path:
            raise ValueError("No workspace path configured for this session.")
        safe_path = os.path.abspath(os.path.join(target_path, requested_path))
        if not safe_path.startswith(os.path.abspath(target_path)):
            raise PermissionError(f"Access denied. Cannot access paths outside {target_path}")
        return safe_path

    @tool
    def list_files(directory: str = "") -> str:
        """List files and directories in the workspace. Provide an empty string for the root."""
        try:
            safe_dir = get_safe_path(directory)
            if not os.path.exists(safe_dir):
                return f"Error: Directory '{directory}' does not exist."
            items = os.listdir(safe_dir)
            return f"Contents of '{directory}':\n" + "\n".join(items) if items else "Directory is empty."
        except Exception as e:
            return f"Error listing files: {str(e)}"

    @tool
    def read_file(filepath: str) -> str:
        """Read the contents of a file in the workspace."""
        try:
            safe_file = get_safe_path(filepath)
            if not os.path.isfile(safe_file):
                return f"Error: File '{filepath}' not found."
            with open(safe_file, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            return f"Error reading file: {str(e)}"

    @tool
    def write_file(filepath: str, content: str) -> str:
        """Write content to a file in the workspace. Will overwrite existing files."""
        try:
            safe_file = get_safe_path(filepath)
            os.makedirs(os.path.dirname(safe_file), exist_ok=True)
            with open(safe_file, "w", encoding="utf-8") as f:
                f.write(content)
            return f"Successfully wrote to '{filepath}'."
        except Exception as e:
            return f"Error writing file: {str(e)}"

    return [list_files, read_file, write_file]

class LangGraphService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.error("GEMINI_API_KEY is missing from environment variables!")
            raise ValueError("API key required for Gemini Developer API.")
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)

    def build_graph(self, meeting_id: int, participants: list, target_path: str = None):
        builder = StateGraph(AgentState)
        staff_names = [p.staff.name for p in participants if p.staff is not None]

        tools = get_workspace_tools(target_path) if target_path else []
        if tools:
            builder.add_node("call_tool", ToolNode(tools))

        # 1. Made Supervisor ASYNC and added a safe fallback
        async def supervisor_node(state: AgentState):
            system_prompt = (
                f"You are the Supervisor. Staff: {', '.join(staff_names)}. "
                "Direct the conversation. If the user's request is satisfied, say 'FINISH'. "
                "Otherwise, output exactly the name of the next staff member to speak."
            )
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_prompt),
                MessagesPlaceholder(variable_name="messages"),
            ])
            chain = prompt | self.llm
            response = await chain.ainvoke(state) # Async invocation!

            content = response.content.strip()
            
            # Safe Fallback to prevent UnboundLocalError
            next_spkr = "FINISH" 
            if "FINISH" not in content and len(state["messages"]) <= 15:
                for name in staff_names:
                    if name.lower() in content.lower():
                        next_spkr = name
                        break

            return {"next_speaker": next_spkr}

        builder.add_node("Supervisor", supervisor_node)

        # 2. Made Staff ASYNC
        def create_staff_node(staff_data):
            async def staff_node(state: AgentState):
                sys_msg = SystemMessage(content=staff_data.system_prompt or "You are a helpful AI.")
                messages = [sys_msg] + list(state["messages"])
                
                agent_llm = self.llm.bind_tools(tools) if tools else self.llm
                response = await agent_llm.ainvoke(messages) # Async invocation!
                response.name = staff_data.name

                return {"messages": [response], "next_speaker": staff_data.name}
            return staff_node

        for p in participants:
            builder.add_node(p.staff.name, create_staff_node(p.staff))

        # Routing Logic
        builder.add_edge(START, "Supervisor")
        builder.add_conditional_edges("Supervisor", lambda x: x["next_speaker"], {name: name for name in staff_names} | {"FINISH": END})
        
        for name in staff_names:
            builder.add_conditional_edges(name, lambda x: "call_tool" if x["messages"][-1].tool_calls else "Supervisor")
            
        if tools:
            builder.add_conditional_edges("call_tool", lambda x: x["next_speaker"] if x["next_speaker"] in staff_names else "Supervisor")

        return builder.compile()

    async def run_autonomous_session(self, meeting_id, user_prompt, participants, target_path):
        graph = self.build_graph(meeting_id, participants, target_path)
        initial_state = {
            "messages": [HumanMessage(content=user_prompt)],
            "next_speaker": "Supervisor",
            "meeting_id": meeting_id,
            "target_path": target_path,
        }

        # 1. Create a mapping of staff names to their IDs so we can link the DB records
        staff_map = {p.staff.name: p.staff.id for p in participants if p.staff}

        try:
            async for event in graph.astream(initial_state, stream_mode="updates"):
                for node_name, state_update in event.items():
                    if "messages" in state_update:
                        for msg in state_update["messages"]:
                            
                            # Filter for AIMessages (AI agent responses)
                            if isinstance(msg, AIMessage) and msg.content:
                                
                                # Extract string from complex payloads
                                content_str = ""
                                if isinstance(msg.content, str):
                                    content_str = msg.content
                                elif isinstance(msg.content, list):
                                    text_parts = []
                                    for part in msg.content:
                                        if isinstance(part, str):
                                            text_parts.append(part)
                                        elif isinstance(part, dict) and "text" in part:
                                            text_parts.append(part["text"])
                                    content_str = "".join(text_parts)
                                
                                # If we successfully extracted text, save it and yield it
                                if content_str.strip():
                                    speaker_name = getattr(msg, "name", node_name)
                                    
                                    # 2. SAVE TO DATABASE (Using a local session)
                                    from ..database import SessionLocal
                                    from ..models import MeetingMessage
                                    
                                    with SessionLocal() as db:
                                        db_msg = MeetingMessage(
                                            meeting_id=meeting_id,
                                            staff_id=staff_map.get(speaker_name),
                                            sender_type="staff",
                                            sender_name=speaker_name,
                                            content=content_str,
                                        )
                                        db.add(db_msg)
                                        db.commit()

                                    # 3. Stream to frontend
                                    yield {
                                        "type": "content",
                                        "speaker": speaker_name,
                                        "content": content_str,
                                    }
        except Exception as e:
            logger.error(f"Graph runtime error: {e}")
            yield {"type": "error", "message": f"Session failed: {str(e)}"}

        yield {"type": "node_start", "node": "END"}