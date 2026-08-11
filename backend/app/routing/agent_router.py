from app.agents.road_design_agent import RoadDesignAgent
from app.agents.whatsapp_agent import WhatsAppAssistant
from app.agents.email_agent import EmailAssistant
from app.api.schemas.enums import AgentType, RetrievalMethod


class AgentRouter:

    def __init__(
        self,
        road_agent: RoadDesignAgent,
        whatsapp_agent: WhatsAppAssistant,
        email_agent: EmailAssistant,
    ):
        self.agents = {
            AgentType.ROAD: road_agent,
            AgentType.WHATSAPP: whatsapp_agent,
            AgentType.EMAIL: email_agent,
        }

    async def ask(
        self,
        agent: AgentType,
        query: str,
        context: dict | None = None,
    ):

        selected_agent = self.agents[agent]

        return await selected_agent.invoke(
            query=query,
            context=context
        )