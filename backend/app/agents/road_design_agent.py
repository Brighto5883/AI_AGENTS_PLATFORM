from app.agent.base_agent import BaseAgent
from app.mcp.road.prompts import ROAD_AGENT_SYSTEM_PROMPT


class RoadDesignAgent(BaseAgent):

    def __init__(self):

        super().__init__(
            system_prompt=ROAD_AGENT_SYSTEM_PROMPT
        )