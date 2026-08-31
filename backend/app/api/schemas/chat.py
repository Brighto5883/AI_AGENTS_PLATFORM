from pydantic import BaseModel


class QueryResponse(BaseModel):
    method: str
    answer: str
    document: str
    cost: float