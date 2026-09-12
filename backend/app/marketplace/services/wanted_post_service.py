from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models.wanted_post import WantedPost
from app.marketplace.moderation.text_scanner import scan_text
from app.marketplace.schemas.wanted_posts import WantedPostCreate, WantedPostUpdate


class WantedPostService:

    async def create_wanted_post(
        self,
        requester_id: UUID,
        data: WantedPostCreate,
        session: AsyncSession,
    ) -> WantedPost:

        moderation_result = scan_text(f"{data.title} {data.description}")

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
            requester_id=requester_id,
            title=data.title,
            description=data.description,
            category=data.category,
            budget=data.budget,
            is_open=True,
        )

        session.add(wanted_post)
        await session.commit()
        await session.refresh(wanted_post, attribute_names=["requester"])

        return wanted_post
# ==================================================================================
    async def list_open_posts(self, session: AsyncSession) -> list[WantedPost]:
        result = await session.execute(
            select(WantedPost)
            .options(selectinload(WantedPost.requester))
            .where(WantedPost.is_open.is_(True))
            .order_by(WantedPost.created_at.desc())
        )
        return list(result.scalars().all())

# ==================================================================================
    async def get_wanted_post(self, wanted_id: UUID, session: AsyncSession) -> WantedPost:
        result = await session.execute(
            select(WantedPost)
            .options(selectinload(WantedPost.requester))
            .where(WantedPost.id == wanted_id)
        )
        wanted_post = result.scalar_one_or_none()

        if wanted_post is None:
            raise HTTPException(status_code=404, detail="Wanted post not found.")

        return wanted_post

# ==================================================================================
    async def list_my_posts(
        self,
        requester_id: UUID,
        session: AsyncSession,
    ) -> list[WantedPost]:
        result = await session.execute(
            select(WantedPost)
            .options(selectinload(WantedPost.requester))
            .where(WantedPost.requester_id == requester_id)
            .order_by(WantedPost.created_at.desc())
        )
        return list(result.scalars().all())

# ===================================================================================
    async def mark_post_fulfilled(
        self,
        wanted_id: UUID,
        requester_id: UUID,
        session: AsyncSession,
    ) -> WantedPost:
        wanted_post = await self.get_wanted_post(
            wanted_id=wanted_id,
            session=session,
        )

        if wanted_post.requester_id != requester_id:
            raise HTTPException(
                status_code=403,
                detail="You do not own this wanted post.",
            )

        wanted_post.is_open = False

        await session.commit()

        return wanted_post

#== =================================================================================
    async def update_wanted_post(
        self,
        wanted_id: UUID,
        requester_id: UUID,
        data: WantedPostUpdate,
        session: AsyncSession,
    ) -> WantedPost:
        wanted_post = await self.get_wanted_post(
            wanted_id=wanted_id,
            session=session,
        )

        if wanted_post.requester_id != requester_id:
            raise HTTPException(
                status_code=403,
                detail="You do not own this wanted post.",
            )

        update_data = data.model_dump(exclude_unset=True)

        if "title" in update_data or "description" in update_data:
            title = update_data.get(
                "title",
                wanted_post.title,
            )
            description = update_data.get(
                "description",
                wanted_post.description,
            )

            moderation_result = scan_text(
                f"{title} {description}"
            )

            if not moderation_result["passed"]:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": (
                            "Wanted post contains prohibited "
                            "contact information."
                        ),
                        "reason": moderation_result["reason"],
                        "flagged": moderation_result["flagged"],
                    },
                )

        for field, value in update_data.items():
            setattr(wanted_post, field, value)

        await session.commit()

        result = await session.execute(
            select(WantedPost)
            .options(selectinload(WantedPost.requester))
            .where(WantedPost.id == wanted_post.id)
        )

        return result.scalar_one()

# ===================================================================================
    async def delete_wanted_post(
        self,
        wanted_id: UUID,
        requester_id: UUID,
        session: AsyncSession,
    ) -> None:
        wanted_post = await self.get_wanted_post(
            wanted_id=wanted_id,
            session=session,
        )

        if wanted_post.requester_id != requester_id:
            raise HTTPException(
                status_code=403,
                detail="You do not own this wanted post.",
            )

        await session.delete(wanted_post)
        await session.commit()
