from app.agent.base_agent import BaseAgent
from app.core.enums import AgentType
from app.mcp.road.prompts import ROAD_AGENT_SYSTEM_PROMPT


class RoadDesignAgent(BaseAgent):

    mcp_server_names = ['road']
    agent_type = AgentType.ROAD

    def __init__(self):

        super().__init__(
            system_prompt=ROAD_AGENT_SYSTEM_PROMPT
        )