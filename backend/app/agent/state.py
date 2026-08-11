from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """
    State shared across the entire agent graph.
    """
    messages: Annotated[list, add_messages]
    conversation_id: int
    customer: dict
    retrieved_docs: list