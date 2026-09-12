from pydantic import BaseModel, Field


class AgentResponse(BaseModel):
    """Application-level result returned by an agent."""

    answer: str
    documents: list[str] = Field(default_factory=list)
    cost: float = 0.0
