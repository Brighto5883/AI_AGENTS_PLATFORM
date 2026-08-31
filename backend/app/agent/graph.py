from langchain_core.messages import SystemMessage
from langgraph.graph import START, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from app.agent.state import AgentState


def create_agent_graph(llm, TOOLS, System_Prompt):
    """
    Creates and compiles the Agent graph.
    """

    llm_with_tools = llm.bind_tools(TOOLS)

    # ------------------------------------------------------------------
    # Nodes
    # ------------------------------------------------------------------

    def llm_node(state: AgentState):
        messages = [
            SystemMessage(content=System_Prompt),
            *state["messages"]
        ]

        response = llm_with_tools.invoke(messages)

        return {
            "messages": [response]
        }

    # ------------------------------------------------------------------
    # Graph
    # ------------------------------------------------------------------

    builder = StateGraph(AgentState)

    builder.add_node("llm_node", llm_node)

    builder.add_node(
        "tools",
        ToolNode(TOOLS)
    )

    # ------------------------------------------------------------------
    # Edges
    # ------------------------------------------------------------------

    builder.add_edge(
        START,
        "llm_node"
    )

    builder.add_conditional_edges(
        "llm_node",
        tools_condition
    )

    builder.add_edge(
        "tools",
        "llm_node"
    )

    # ------------------------------------------------------------------
    # Compile
    # ------------------------------------------------------------------

    graph = builder.compile()

    return graph































# from typing import Annotated
# from typing_extensions import TypedDict
# from langchain_tavily import TavilySearch
# from langchain_core.messages import SystemMessage
# from langgraph.graph.message import add_messages
# from langgraph.graph import StateGraph,START,END
# from langgraph.prebuilt import ToolNode
# from langgraph.prebuilt import tools_condition
# import os
# import warnings
# import logging
# import litellm

# from dotenv import load_dotenv
# load_dotenv(override=True)

# # Keep the recording clean — suppress noisy AWS-related warnings
# warnings.filterwarnings("ignore")
# logging.getLogger("LiteLLM").setLevel(logging.ERROR)
# litellm.suppress_debug_info = True

# os.environ['GROQ_API_KEY'] = os.getenv('GROQ_API_KEY')
# os.environ['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY')
# os.environ['ANTHROPIC_API_KEY'] = os.getenv('ANTHROPIC_API_KEY')
# os.environ['GEMINI_API_KEY'] = os.getenv('GEMINI_API_KEY')

# class State(TypedDict):
#     # Messages have the type "list". The `add_messages` function
#     # in the annotation defines how this state key should be updated
#     # (in this case, it appends messages to the list, rather than overwriting them)
#     messages:Annotated[list,add_messages]

# SYSTEM_PROMPT = """
# You are a Kenyan highway design assistant.
# Answer using the provided context.
# If the answer is not in the context, get it from other sources and cite the sources in
# your explanation.
# """

# tool=TavilySearch(max_results=2)
# tools=[tool, ]

# def build_graph(llm: str):
#     graph_llm=llm
#     llm_with_tool=graph_llm.bind_tools(tools)

#     ## Node definition
#     def tool_calling_llm(state:State):
#         messages = [
#             SystemMessage(content=SYSTEM_PROMPT),
#             *state["messages"]
#         ]
#         return {"messages":[llm_with_tool.invoke(messages)]}
#     ## Graph
#     builder=StateGraph(State)
#     builder.add_node("tool_calling_llm",tool_calling_llm)
#     builder.add_node("tools",ToolNode(tools))

#     ## Add Edges
#     builder.add_edge(START, "tool_calling_llm")
#     builder.add_conditional_edges(
#         "tool_calling_llm",
#         # If the latest message (result) from assistant is a tool call -> tools_condition routes to tools
#         # If the latest message (result) from assistant is a not a tool call -> tools_condition routes to END
#         tools_condition
#     )
#     builder.add_edge("tools",'tool_calling_llm')

#     ## compile the graph
#     graph=builder.compile()
#     return graph
