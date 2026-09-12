from app.agent.base_agent import BaseAgent
from app.agent.tool_binding import bind_context_arg
from app.core.enums import AgentType
from app.mcp.whatsapp.prompts import WHATSAPP_AGENT_SYSTEM_PROMPT


class WhatsAppAssistant(BaseAgent):
    
    mcp_server_names = ['whatsapp']
    agent_type = AgentType.WHATSAPP
    
    def __init__(self):

        super().__init__(
            system_prompt=WHATSAPP_AGENT_SYSTEM_PROMPT
        )

    def _prepare_tools(self, tools):
        return [
            bind_context_arg(
                t, 
                arg_name="conversation_id", 
                context_key="conversation_id"
            )
            if t.name == "get_conversation_context" else t
            for t in tools
        ]