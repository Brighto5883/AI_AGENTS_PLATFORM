import uuid
from pydantic import BaseModel
from fastapi_users import schemas

class QueryRequest(BaseModel):
    query: str
    method: str

class QueryResponse(BaseModel):
    method: str
    answer: str
    document: str
    cost: float

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

class UserRead(schemas.BaseUser[uuid.UUID]):
    pass

class UserCreate(schemas.BaseUserCreate):
    pass

class UserUpdate(schemas.BaseUserUpdate):
    pass