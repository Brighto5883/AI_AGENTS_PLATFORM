from app.agent.client import MCPClient
from app.agent.graph import create_agent_graph
from app.agent.context import agent_context
from app.api.schemas.agent import AgentResponse
from app.llm.gateway import build_llm


class BaseAgent:
    """
    Main AI Agent responsible for handling user requests.

    It owns:
        - the LLM
        - the MCP client
        - the LangGraph workflow
    """

    mcp_server_names: list[str] = []  # subclasses override — outside __init__, class-level

    def __init__(
        self,
        system_prompt: str,
        model: str = "primary-agent-model",
        temperature: float = 0,
    ):

        self.system_prompt = system_prompt

        self.llm = build_llm(model, temperature=temperature)

        # self.llm = ChatLiteLLM(
        #     model=model,
        #     temperature=temperature
        # )

        self.client = MCPClient()

        self.graph = None


    async def initialize(self):
        tools = await self.client.get_tools(server_names=self.mcp_server_names)
        tools = self._prepare_tools(tools)

        self.graph = create_agent_graph(
            llm=self.llm,
            TOOLS=tools,
            System_Prompt=self.system_prompt
        )


    def _prepare_tools(self, tools):
            """
            Hook for subclasses to rewrap tools before they're bound to the LLM
            (e.g. hiding caller-known IDs — see WhatsAppAssistant). Default:
            no change, so existing agents are unaffected.
            """
            return tools


    async def invoke(
        self,
        query: str,
        context: dict | None = None,
    ) -> AgentResponse:

        if self.graph is None:
            await self.initialize()

        context = context or {}
        history = context.get('history', [])

        token = agent_context.set(context)
        try:
            response = await self.graph.ainvoke(
                {
                    "messages": [
                        *history,
                        {"role": "user", "content": query}
                    ]
                }
            )
        finally:
            agent_context.reset(token)

        return AgentResponse(
            answer=response['messages'][-1].content,
            cost=response.get('cost', 0.0)
        )
