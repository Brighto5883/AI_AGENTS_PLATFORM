from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models.wanted_post import WantedPost
from app.marketplace.moderation.text_scanner import scan_text
from app.marketplace.schemas.wanted_posts import WantedPostCreate


class WantedPostService:

    async def create_wanted_post(
        self,
        buyer_id: UUID,
        data: WantedPostCreate,
        session: AsyncSession,
    ) -> WantedPost:

        moderation_result = scan_text(
            f"{data.title} {data.description}"
        )

        if not moderation_result["passed"]:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Wanted post contains prohibited contact information.",
                    "reason": moderation_result["reason"],
                    "flagged": moderation_result["flagged"],
                },
            )

        wanted_post = WantedPost(
            buyer_id=buyer_id,
            title=data.title,
            description=data.description,
            budget=data.budget,
            is_open=True,
        )

        session.add(wanted_post)
        await session.commit()
        await session.refresh(wanted_post)

        return wanted_post

    async def list_open_posts(
        self,
        session: AsyncSession,
    ) -> list[WantedPost]:

        result = await session.execute(
            select(WantedPost)
            .where(WantedPost.is_open.is_(True))
            .order_by(WantedPost.created_at.desc())
        )

        return list(result.scalars().all())

    async def get_wanted_post(
        self,
        wanted_id: UUID,
        session: AsyncSession,
    ) -> WantedPost:

        wanted_post = await session.get(WantedPost, wanted_id)

        if wanted_post is None:
            raise HTTPException(
                status_code=404,
                detail="Wanted post not found.",
            )

        return wanted_post
