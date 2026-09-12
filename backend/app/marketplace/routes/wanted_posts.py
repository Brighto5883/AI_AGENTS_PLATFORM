from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.container import container
from app.database.models.user import User
from app.database.session import get_async_session
from app.database.users import current_active_user
from app.marketplace.schemas.wanted_posts import (
    WantedPostCreate,
    WantedPostResponse,
    WantedPostUpdate,
)

router = APIRouter(
    prefix="/marketplace/wanted",
    tags=["Marketplace Wanted Posts"],
)

# ==================================================================================
@router.post(
    "/",
    response_model=WantedPostResponse,
)
async def create_wanted_post(
    data: WantedPostCreate,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    return await container.wanted_post_service.create_wanted_post(
        requester_id=authenticated_user.id,
        data=data,
        session=session,
    )
# ==================================================================================
@router.get(
    "/",
    response_model=list[WantedPostResponse],
)
async def list_wanted_posts(
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    return await container.wanted_post_service.list_open_posts(
        session=session,
    )
# ==================================================================================
@router.get(
    "/my-posts",
    response_model=list[WantedPostResponse],
)
async def get_my_wanted_posts(
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    return await container.wanted_post_service.list_my_posts(
        requester_id=authenticated_user.id,
        session=session,
    )
# ==================================================================================
@router.patch(
    "/{wanted_id}/fulfilled",
    response_model=WantedPostResponse,
)
async def mark_wanted_post_fulfilled(
    wanted_id: UUID,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    return await container.wanted_post_service.mark_post_fulfilled(
        wanted_id=wanted_id,
        requester_id=authenticated_user.id,
        session=session,
    )

# ====================================================================================
@router.patch(
    "/{wanted_id}",
    response_model=WantedPostResponse,
)
async def update_wanted_post(
    wanted_id: UUID,
    data: WantedPostUpdate,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    wanted_post = await container.wanted_post_service.update_wanted_post(
        wanted_id=wanted_id,
        requester_id=authenticated_user.id,
        data=data,
        session=session,
    )

    return wanted_post

# ==================================================================================
@router.get(
    "/{wanted_id}",
    response_model=WantedPostResponse,
)
async def get_wanted_post(
    wanted_id: UUID,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    return await container.wanted_post_service.get_wanted_post(
        wanted_id=wanted_id,
        session=session,
    )

# ===================================================================================
@router.delete(
    "/{wanted_id}",
    status_code=204,
)
async def delete_wanted_post(
    wanted_id: UUID,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    await container.wanted_post_service.delete_wanted_post(
        wanted_id=wanted_id,
        requester_id=authenticated_user.id,
        session=session,
    )





