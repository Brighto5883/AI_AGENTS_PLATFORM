from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import class_mapper

from app.database.models.draft_reply import DraftReply
from app.database.models.feedback import Feedback
from app.database.models.listing import Listing
from app.database.models.llm_usage_log import LLMUsageLog
from app.database.models.payment import Payment
from app.database.models.podcast_ruleset import PodcastRule, PodcastRuleSet
from app.database.models.query_history import QueryHistory
from app.database.models.transaction import Transaction
from app.database.models.user import User
from app.database.models.wanted_post import WantedPost
from app.database.models.whatsapp_conversation import (
    WhatsAppConversation,
    WhatsAppMessage,
)


class AccountDeletionService:

    async def delete_account(
        self,
        *,
        user_id: UUID,
        session: AsyncSession,
        delete_storage_objects,
    ) -> None:
        """Permanently delete all data owned by a user."""

        # ---------------------------------------------------------------
        # Collect marketplace image keys before deleting their listings.
        # ---------------------------------------------------------------

        image_result = await session.execute(
            select(Listing.id)
            .where(Listing.seller_id == user_id)
        )
        listing_ids = list(image_result.scalars().all())

        storage_keys: list[str] = []

        if listing_ids:
            from app.database.models.listing_image import ListingImage

            image_result = await session.execute(
                select(ListingImage.storage_key).where(
                    ListingImage.listing_id.in_(listing_ids)
                )
            )
            storage_keys = list(image_result.scalars().all())

        # ---------------------------------------------------------------
        # Draft replies owned by this user.
        # ---------------------------------------------------------------

        await session.execute(
            delete(DraftReply).where(
                DraftReply.user_id == user_id
            )
        )

        # reviewed_by also references users.
        await session.execute(
            delete(DraftReply).where(
                DraftReply.reviewed_by == user_id
            )
        )

        # ---------------------------------------------------------------
        # WhatsApp conversations owned by this user.
        #
        # The conversation FK is SET NULL, so these would otherwise
        # survive account deletion.
        # ---------------------------------------------------------------

        conversation_result = await session.execute(
            select(WhatsAppConversation.id).where(
                WhatsAppConversation.user_id == user_id
            )
        )
        conversation_ids = list(conversation_result.scalars().all())

        if conversation_ids:
            await session.execute(
                delete(DraftReply).where(
                    DraftReply.conversation_id.in_(conversation_ids)
                )
            )

            await session.execute(
                delete(WhatsAppMessage).where(
                    WhatsAppMessage.conversation_id.in_(conversation_ids)
                )
            )

            await session.execute(
                delete(WhatsAppConversation).where(
                    WhatsAppConversation.id.in_(conversation_ids)
                )
            )

        # ---------------------------------------------------------------
        # Marketplace financial records.
        # ---------------------------------------------------------------

        await session.execute(
            delete(Transaction).where(
                (Transaction.buyer_id == user_id)
                | (Transaction.seller_id == user_id)
                | (Transaction.initiator_id == user_id)
                | (Transaction.payer_id == user_id)
            )
        )

        await session.execute(
            delete(Payment).where(
                Payment.payer_id == user_id
            )
        )

        # ---------------------------------------------------------------
        # Marketplace content.
        # ---------------------------------------------------------------

        await session.execute(
            delete(Listing).where(
                Listing.seller_id == user_id
            )
        )

        await session.execute(
            delete(WantedPost).where(
                WantedPost.requester_id == user_id
            )
        )

        # ---------------------------------------------------------------
        # User-generated AI/application data.
        # ---------------------------------------------------------------

        await session.execute(
            delete(QueryHistory).where(
                QueryHistory.user_id == user_id
            )
        )

        await session.execute(
            delete(LLMUsageLog).where(
                LLMUsageLog.user_id == user_id
            )
        )

        await session.execute(
            delete(Feedback).where(
                Feedback.user_id == user_id
            )
        )

        # ---------------------------------------------------------------
        # Podcast rule sets and their rules.
        # ---------------------------------------------------------------

        rule_set_result = await session.execute(
            select(PodcastRuleSet.id).where(
                PodcastRuleSet.user_id == str(user_id)
            )
        )
        rule_set_ids = list(rule_set_result.scalars().all())

        if rule_set_ids:
            await session.execute(
                delete(PodcastRule).where(
                    PodcastRule.rule_set_id.in_(rule_set_ids)
                )
            )

            await session.execute(
                delete(PodcastRuleSet).where(
                    PodcastRuleSet.id.in_(rule_set_ids)
                )
            )

        # ---------------------------------------------------------------
        # Finally delete the user.
        # ---------------------------------------------------------------

        user_id_column = class_mapper(User).columns.id

        await session.execute(
            delete(User).where(
                user_id_column == user_id
            )
        )

        await session.commit()

        # ---------------------------------------------------------------
        # Remove external marketplace image objects after the DB
        # transaction succeeds.
        # ---------------------------------------------------------------

        if storage_keys:
            await delete_storage_objects(storage_keys=storage_keys)
