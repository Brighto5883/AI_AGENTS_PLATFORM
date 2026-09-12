from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas.feedback import FeedbackCreate
from app.database.models.feedback import Feedback


class FeedbackService:

    async def create_feedback(
        self,
        *,
        user_id: UUID,
        data: FeedbackCreate,
        session: AsyncSession,
    ) -> Feedback:
        feedback = Feedback(
            user_id=user_id,
            category=data.category,
            message=data.message.strip(),
            screen=data.screen,
        )

        session.add(feedback)

        await session.commit()
        await session.refresh(feedback)

        return feedback