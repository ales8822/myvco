# 1. Modified backend/app/services/autogen_service.py

import os
import autogen
from typing import List, Dict, Any
from ..config import settings

class AutoGenService:
    """
    The Bridge: Converts MyVCO Database Objects into AutoGen Agents.
    """

    def __init__(self):
        self.work_dir = "autogen_workspace"
        if not os.path.exists(self.work_dir):
            os.makedirs(self.work_dir)

    def _get_llm_config(self, provider: str, model: str) -> Dict[str, Any]:
        """
        Translates MyVCO LLM settings into AutoGen's 'config_list' format.
        """
        config_list = []
        
        # Preservation of your lowered temperature for tool stability
        config = {
            "config_list": config_list,
            "temperature": 0.5,
            "timeout": 180,
        }
        
        if provider == "ollama":
            base_url = settings.ollama_base_url
            if base_url and not base_url.endswith("/v1"):
                base_url = f"{base_url.rstrip('/')}/v1"

            config_list.append({
                "model": model or "llama3",
                "base_url": base_url,
                "api_key": "ollama",
                "api_type": "open_ai",
                "price": [0, 0],
            })

        elif provider == "gemini":
            config_list.append({
                "model": model or "gemini-2.0-flash", # Use current flash stable
                "api_key": settings.gemini_api_key,
                "api_type": "google" 
            })

        return config
    
    def create_agent(self, staff_name: str, system_prompt: str, provider: str, model: str) -> autogen.AssistantAgent:
        """
        Creates a speaking Agent (The Staff Member)
        """
        llm_config = self._get_llm_config(provider, model)
        
        safe_name = "".join(c if c.isalnum() else "_" for c in staff_name)

        # 1.1 ADDED: Protocol safety for Gemini function calling
        # This prevents the 'INVALID_ARGUMENT' error by forcing the AI to work turn-by-turn.
        serial_directive = (
            "\n\n[TOOL PROTOCOL]:"
            "\n1. You MUST call tools one-at-a-time."
            "\n2. Wait for a 'TOOL_RESULT' before suggesting further steps."
            "\n3. Do not attempt to read or write multiple files in a single turn."
        )
        
        agent = autogen.AssistantAgent(
            name=safe_name,
            system_message=system_prompt + serial_directive, # Append logic safely
            llm_config=llm_config,
            description=f"This is {staff_name}, an AI staff member."
        )
        return agent

    def create_user_proxy(self) -> autogen.UserProxyAgent:
        """
        Creates the 'Manager' (You/The System) that injects the task.
        Configured to NEVER ask for human input (Autonomous Mode).
        """
        user_proxy = autogen.UserProxyAgent(
            name="User_Admin",
            human_input_mode="NEVER", 
            max_consecutive_auto_reply=10, 
            is_termination_msg=lambda x: x.get("content", "").rstrip().endswith("TERMINATE"),
            code_execution_config=False, 
        )
        return user_proxy

# Singleton
autogen_service = AutoGenService()