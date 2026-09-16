import logging
import uuid

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.database.models.user import User
from app.database.session import get_async_session

logger = logging.getLogger(__name__)


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]): # 1 usage
    reset_password_token_secret = settings.JWT_SECRET
    verification_token_secret = settings.JWT_SECRET

    async def on_after_register(self, user: User, request: Request | None = None):
        logger.info("User registered", extra={"user_id": str(user.id)})

    async def on_after_forgot_password(self, user: User, token: str, request: Request | None = None):
        logger.info("Password reset requested", extra={"user_id": str(user.id)})

    async def on_after_request_verify(self, user: User, token: str, request: Request | None = None):
        logger.info("Email verification requested", extra={"user_id": str(user.id)})

async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)

async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)

bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")

def get_jwt_strategy(): #1 usage
    return JWTStrategy(
        secret=settings.JWT_SECRET, 
        lifetime_seconds=3600,
    )

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,

)

fastapi_users = FastAPIUsers[User, uuid.UUID](
    get_user_manager,
    [auth_backend]
    )

current_active_user = fastapi_users.current_user(active=True)
