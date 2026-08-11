from pydantic import BaseModel
from app.api.schemas.enums import (
    AgentType,
    RetrievalMethod,
)


class QueryRequest(BaseModel):
    query: str
    method: RetrievalMethod = RetrievalMethod.AUTO

class QueryResponse(BaseModel):
    method: str
    answer: str
    document: str
    cost: float