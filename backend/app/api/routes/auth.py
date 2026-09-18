from fastapi import APIRouter, Depends, Response, status

from app.api.routes.password_reset import router as password_reset_router
from app.api.schemas.auth import (
    UserCreate,
    UserRead,
    UserUpdate,
)
from app.core.container import container
from app.database.models.user import User
from app.database.session import get_async_session
from app.database.users import (
    auth_backend,
    current_active_user,
    fastapi_users,
)
from app.services.account_deletion_service import AccountDeletionService

router = APIRouter()


@router.delete(
    "/account",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["auth"],
)
async def delete_my_account(
    user: User = Depends(current_active_user),
    session=Depends(get_async_session),
):
    await AccountDeletionService().delete_account(
        user_id=user.id,
        session=session,
        delete_storage_objects=container.listing_image_service.delete_storage_objects,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def register_auth_routes(api):

    api.include_router(
        fastapi_users.get_auth_router(auth_backend),
        prefix="/auth/jwt",
        tags=["auth"],
    )

    api.include_router(
        fastapi_users.get_register_router(
            UserRead,
            UserCreate,
        ),
        prefix="/auth",
        tags=["auth"],
    )

    api.include_router(
        password_reset_router,
        tags=["auth"],
    )

    api.include_router(
        fastapi_users.get_users_router(
            UserRead,
            UserUpdate,
        ),
        prefix="/users",
        tags=["users"],
    )

    api.include_router(router)
