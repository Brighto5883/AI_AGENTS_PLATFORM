
from pydantic import BaseModel

class QueryHistoryResponse(BaseModel):
    id: str
    user_id: str
    query: str
    method: str
    answer: str
    document: str
    cost: float

    model_config = {
        "from_attributes": True
    }

class QueryHistoryDelete(BaseModel):
    id: str
    query: str
    method: str
    answer: str
    document: str
    cost: float