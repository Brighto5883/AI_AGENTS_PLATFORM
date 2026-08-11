from app.database.users import (
    fastapi_users,
    auth_backend,
)

from app.api.schemas.auth import (
    UserRead,
    UserCreate,
    UserUpdate,
)


def register_auth_routes(api):

    api.include_router(
        fastapi_users.get_auth_router(auth_backend),
        prefix="/auth/jwt",
        tags=["auth"],
    )

    api.include_router(
        fastapi_users.get_register_router(
            UserRead,
            UserCreate
        ),
        prefix="/auth",
        tags=["auth"],
    )

    api.include_router(
        fastapi_users.get_reset_password_router(),
        prefix="/auth",
        tags=["auth"],
    )

    api.include_router(
        fastapi_users.get_verify_router(
            UserRead
        ),
        prefix="/auth",
        tags=["auth"],
    )

    api.include_router(
        fastapi_users.get_users_router(
            UserRead,
            UserUpdate
        ),
        prefix="/users",
        tags=["users"],
    )