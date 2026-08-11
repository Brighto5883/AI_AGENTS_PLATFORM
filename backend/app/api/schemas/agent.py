from pydantic import BaseModel


class AgentResponse(BaseModel):
    answer: str
    documents: list[str] = []
    cost: float = 0.0