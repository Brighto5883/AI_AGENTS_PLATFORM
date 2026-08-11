from fastapi import APIRouter, Depends
from app.database.session import get_async_session
from app.core.container import Container
from app.database.models.user import User
from app.database.users import current_active_user
from app.api.schemas.chat import (
    QueryRequest,
    QueryResponse,
)
from app.api.dependencies.rate_limit import enforce_rate_limit
from app.core.container import container


router = APIRouter(
    prefix="/query",
    tags=["Chat"],
)


@router.post(
    "/",
    response_model=QueryResponse,
)

async def execute_query(
    request: QueryRequest,
    authenticated_user: User = Depends(current_active_user),
    _rate_limit=Depends(enforce_rate_limit),
    session=Depends(get_async_session),
):

    return await container.chat_service.execute_query(
        query=request.query,
        method=request.method,
        user_id=authenticated_user.id,
        session=session,
    )