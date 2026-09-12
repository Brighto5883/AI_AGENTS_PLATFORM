from app.api.routes.password_reset import router as password_reset_router
from app.api.schemas.auth import (
    UserCreate,
    UserRead,
    UserUpdate,
)
from app.database.users import (
    auth_backend,
    fastapi_users,
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
        password_reset_router,
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







    # api.include_router(
    #     fastapi_users.get_verify_router(
    #         UserRead
    #     ),
    #     prefix="/auth",
    #     tags=["auth"],
    # )

    # api.include_router(
    #     fastapi_users.get_reset_password_router(),
    #     prefix="/auth",
    #     tags=["auth"],
    # )
