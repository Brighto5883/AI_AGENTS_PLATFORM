from fastapi import APIRouter, Depends

from app.database.session import get_async_session
from app.database.models.user import User
from app.database.users import current_active_user

from app.api.schemas.history import (
    QueryHistoryDelete,
    QueryHistoryResponse,
)

from app.core.container import container


router = APIRouter(
    prefix="/feed",
    tags=["History"],
)


@router.get(
    "/",
    response_model=list[QueryHistoryResponse],
)
async def get_query_feed(
    authenticated_user: User = Depends(current_active_user),
    session=Depends(get_async_session),
):

    return await container.history_service.get_history(
        user_id=authenticated_user.id,
        session=session,
    )


@router.delete(
    "/{query_id}",
    response_model=QueryHistoryDelete,
)
async def delete_query_history(
    query_id: str,
    authenticated_user: User = Depends(current_active_user),
    session=Depends(get_async_session),
):

    return await container.history_service.delete_history(
        query_id=query_id,
        user_id=authenticated_user.id,
        session=session,
    )