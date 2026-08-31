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
)

router = APIRouter(
    prefix="/marketplace/wanted",
    tags=["Marketplace Wanted Posts"],
)


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
        buyer_id=authenticated_user.id,
        data=data,
        session=session,
    )


@router.get(
    "/",
    response_model=list[WantedPostResponse],
)
async def list_wanted_posts(
    session: AsyncSession = Depends(get_async_session),
):
    return await container.wanted_post_service.list_open_posts(
        session=session,
    )


@router.get(
    "/{wanted_id}",
    response_model=WantedPostResponse,
)
async def get_wanted_post(
    wanted_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    return await container.wanted_post_service.get_wanted_post(
        wanted_id=wanted_id,
        session=session,
    )
