from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas.feedback import (
    FeedbackCreate,
    FeedbackResponse,
)
from app.core.container import container
from app.database.models.user import User
from app.database.session import get_async_session
from app.database.users import current_active_user

router = APIRouter(
    prefix="/feedback",
    tags=["Feedback"],
)


@router.post(
    "",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_feedback(
    data: FeedbackCreate,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> FeedbackResponse:
    feedback = await container.feedback_service.create_feedback(
        user_id=authenticated_user.id,
        category=data.category,
        message=data.message,
        screen=data.screen,
        session=session,
    )

    return FeedbackResponse.model_validate(feedback)