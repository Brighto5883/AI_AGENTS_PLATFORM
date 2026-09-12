from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import FeedbackCategory
from app.database.models.feedback import Feedback


class FeedbackService:
    async def create_feedback(
        self,
        *,
        user_id: UUID,
        category: FeedbackCategory,
        message: str,
        screen: str | None,
        session: AsyncSession,
    ) -> Feedback:
        feedback = Feedback(
            user_id=user_id,
            category=category,
            message=message.strip(),
            screen=screen.strip() if screen else None,
        )

        session.add(feedback)
        await session.commit()
        await session.refresh(feedback)
        return feedback
