from app.agent.client import MCPClient
from app.agent.context import agent_context
from app.agent.graph import create_agent_graph
from app.agent.state import AgentState
from app.agent.tool_binding import bind_context_arg
from app.api.schemas.agent import AgentResponse
from app.api.schemas.enums import AgentType
from app.knowledge.context import KnowledgeContext
from app.llm.gateway import build_llm


class BaseAgent:
    """
    Main AI Agent responsible for handling user requests.

    It owns:
        - the LLM
        - the MCP client
        - the LangGraph workflow
    """

    shared_mcp_server_names: list[str] = ["shared"]
    mcp_server_names: list[str] = []  # subclasses override — outside __init__, class-level
    agent_type: AgentType | None = None  # subclasses override — same pattern as mcp_server_names

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
        server_names = [
            *self.shared_mcp_server_names,
            *self.mcp_server_names,
        ]

        tools = await self.client.get_tools(
            server_names=server_names
        )

        tools = self._prepare_tools(tools)

        self.graph = create_agent_graph(
            llm=self.llm,
            TOOLS=tools,
            System_Prompt=self.system_prompt
        )


    def _prepare_tools(self, tools):
            """
            Hook for subclasses to rewrap tools before they're bound to the LLM
            (e.g. hiding caller-known IDs — see WhatsAppAssistant). 
            Default: only scope_id is bound for all agents since 'search_knowledge' tool
            is shared by all agents that inherit from this class. Other bindings occur 
            through overwrite at each individual agent creation point
            """
            return [
                bind_context_arg(
                    t,
                    arg_name="scope_id",
                    context_key="knowledge_scope_id",
                )
                if t.name == "search_knowledge"
                else t
                for t in tools
            ]


    async def invoke(
        self,
        query: str,
        context: dict | None = None,
        knowledge: KnowledgeContext | None = None
    ) -> AgentResponse:

        if self.graph is None:
            await self.initialize()

        if self.graph is None:
            raise RuntimeError("Agent graph failed to initialize.")

        context = context or {}

        context.setdefault(
            "agent_name",
            self.agent_type.value if self.agent_type else self.__class__.__name__,
        )

        context["knowledge"] = knowledge

        context["knowledge_scope_id"] = (
            knowledge.scope_id
            if knowledge is not None
            else None
        )
                
        history = context.get('history', [])

        token = agent_context.set(context)
        try:
            graph_input: AgentState = {
                "messages": [
                    *history,
                    {"role": "user", "content": query},
                 ],
                 "retrieved_docs": [],
            }

            response = await self.graph.ainvoke(graph_input)
        finally:
            agent_context.reset(token)

        return AgentResponse(
            answer=response['messages'][-1].content,
            cost=response.get('cost', 0.0)
        )
