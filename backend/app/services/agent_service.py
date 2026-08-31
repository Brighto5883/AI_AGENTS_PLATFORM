from app.api.schemas.enums import AgentType
from app.knowledge.context import KnowledgeContext
from app.routing.agent_router import AgentRouter


class AgentService:

    def __init__(
        self,
        router: AgentRouter,
    ):
        self.router = router

    async def ask(
        self,
        agent: AgentType,
        query: str,
        context: dict | None = None,
        knowledge: KnowledgeContext | None = None,
    ):

        return await self.router.ask(
            agent=agent,
            query=query,
            context=context,
            knowledge=knowledge,
        )