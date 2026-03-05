from autogen import UserProxyAgent, AssistantAgent
from typing import List
from .filesystem import FileSystemTools

def register_filesystem_tools(
    user_proxy: UserProxyAgent, 
    assistants: List[AssistantAgent], 
    root_path: str
):
    """
    Registers FileSystem tools to the UserProxy (Executor) 
    and all AssistantAgents (Callers).
    """
    fs_tools = FileSystemTools(root_path)

    # Define the function map
    # We wrap class methods to make them standalone functions for AutoGen
    
    def list_files(directory: str = "."):
        return fs_tools.list_files(directory)

    def read_file(file_path: str):
        return fs_tools.read_file(file_path)

    def write_file(file_path: str, content: str):
        return fs_tools.write_file(file_path, content)

    # Register for Execution (The User Proxy actually runs the code on the disk)
    user_proxy.register_function(
        function_map={
            "list_files": list_files,
            "read_file": read_file,
            "write_file": write_file,
        }
    )

    # Register for LLM (The Agents need to know these tools exist)
    for agent in assistants:
        agent.register_for_llm(name="list_files", description="List files in the project structure.")(list_files)
        agent.register_for_llm(name="read_file", description="Read code from a file.")(read_file)
        agent.register_for_llm(name="write_file", description="Write full code to a file. Overwrites existing content.")(write_file)