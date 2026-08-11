from app.agent.base_agent import BaseAgent
from app.mcp.email.prompts import EMAIL_AGENT_SYSTEM_PROMPT


class EmailAssistant(BaseAgent):

    def __init__(self):

        super().__init__(
            system_prompt=EMAIL_AGENT_SYSTEM_PROMPT
        )