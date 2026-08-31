from typing import Annotated

from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


class AgentState(TypedDict):
    """
    Generic state shared across the agent graph.
    """

    messages: Annotated[list, add_messages]

    retrieved_docs: list