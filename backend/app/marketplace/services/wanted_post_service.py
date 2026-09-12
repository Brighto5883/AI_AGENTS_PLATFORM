from uuid import UUID

from fastapi import HTTPException

from app.billing.billing_service import BillingService
from app.billing.enums import MarketplaceBillingMode
from app.database.models.transaction import Transaction
from app.marketplace.enums import TransactionStatus
from app.marketplace.schemas.contact import ContactablePublic
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models.wanted_post import WantedPost
from app.marketplace.moderation.text_scanner import scan_text
from app.marketplace.schemas.wanted_posts import WantedPostCreate, WantedPostResponse, WantedPostUpdate


class WantedPostService:

    def __init__(self, billing_service: BillingService) -> None:
        self.billing_service = billing_service

    async def to_response(
        self,
        *,
        wanted_post: WantedPost,
        viewer_id: UUID | None,
        session: AsyncSession,
    ) -> WantedPostResponse:
        unlocked = await self._is_contact_unlocked(
            wanted_post=wanted_post, viewer_id=viewer_id, session=session
        )
        requester = wanted_post.requester
        contact = requester if unlocked else ContactablePublic(
            id=requester.id, name=requester.name, phone=None
        )
        return WantedPostResponse(
            id=wanted_post.id,
            requester_id=wanted_post.requester_id,
            title=wanted_post.title,
            description=wanted_post.description,
            category=wanted_post.category,
            budget=wanted_post.budget,
            is_open=wanted_post.is_open,
            created_at=wanted_post.created_at,
            requester=contact,
            contact_unlocked=unlocked,
        )

    async def _is_contact_unlocked(
        self,
        *,
        wanted_post: WantedPost,
        viewer_id: UUID | None,
        session: AsyncSession,
    ) -> bool:
        if viewer_id == wanted_post.requester_id or not self.billing_service.billing_enabled:
            return True
        if wanted_post.requester.billing_mode == MarketplaceBillingMode.SUBSCRIPTION:
            return True
        if viewer_id is None:
            return False
        result = await session.execute(
            select(Transaction.id).where(
                Transaction.wanted_id == wanted_post.id,
                Transaction.initiator_id == viewer_id,
                Transaction.status == TransactionStatus.PAID,
            ).limit(1)
        )
        return result.scalar_one_or_none() is not None

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
    async def get_wanted_post(
        self,
        wanted_id: UUID,
        session: AsyncSession,
        viewer_id: UUID | None = None,
    ) -> WantedPost:
        result = await session.execute(
            select(WantedPost)
            .options(selectinload(WantedPost.requester))
            .where(WantedPost.id == wanted_id)
        )
        wanted_post = result.scalar_one_or_none()

        if wanted_post is None:
            raise HTTPException(status_code=404, detail="Wanted post not found.")

        if (
            viewer_id is not None
            and wanted_post.requester_id != viewer_id
            and not wanted_post.is_open
        ):
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
