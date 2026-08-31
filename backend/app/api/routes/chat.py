from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.rate_limit import enforce_rate_limit
from app.api.schemas.chat import QueryResponse
from app.api.schemas.enums import RetrievalMethod
from app.core.container import container
from app.database.models.user import User
from app.database.session import get_async_session
from app.database.users import current_active_user

router = APIRouter(
    prefix="/query",
    tags=["Chat"],
)


@router.post(
    "/",
    response_model=QueryResponse,
)

async def execute_query(
    authenticated_user: Annotated[
    User,
    Depends(current_active_user)],

    _rate_limit: Annotated[
        None,
        Depends(enforce_rate_limit),
    ],

    session: Annotated[
        AsyncSession,
        Depends(get_async_session),
    ],

    query: Annotated[str, Form(...)],
    
    file: Annotated[
        UploadFile | None,
        File(),
    ] = None,

    method: Annotated[
        RetrievalMethod,
        Form(),
    ] = RetrievalMethod.AUTO,
):
    return await container.chat_service.execute_query(
        query=query,
        method=method,
        file=file,
        user_id=authenticated_user.id,
        session=session,
    )