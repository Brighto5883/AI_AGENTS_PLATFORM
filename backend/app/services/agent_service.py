from app.routing.agent_router import AgentRouter
from app.api.schemas.enums import AgentType, RetrievalMethod


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
    ):

        return await self.router.ask(
            agent=agent,
            query=query,
            context=context
        )