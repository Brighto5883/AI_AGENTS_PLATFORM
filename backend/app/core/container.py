from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING, cast

from app.config.settings import settings
from app.core.factories import (
    create_billing_service,
    create_feedback_service,
    create_image_processor,
    create_image_storage,
    create_listing_image_service,
    create_listing_service,
    create_payment_service,
    create_pricing_service,
    create_transaction_service,
    create_wanted_post_service,
)

if TYPE_CHECKING:
    from app.agents.email_agent import EmailAssistant
    from app.agents.road_design_agent import RoadDesignAgent
    from app.agents.whatsapp_agent import WhatsAppAssistant
    from app.integrations.whatsapp.client import WhatsAppClient
    from app.integrations.whatsapp.transcription import TranscriptionClient
    from app.memory.service import MemoryService
    from app.routing.agent_router import AgentRouter
    from app.services.agent_service import AgentService
    from app.services.chat_service import ChatService
    from app.services.draft_service import DraftService
    from app.services.history_service import HistoryService
    from app.services.whatsapp_service import WhatsAppService


class Container:
    def __init__(self) -> None:
        # =========================================================================
        # Marketplace services
        # =========================================================================

        self.pricing_service = create_pricing_service()

        self.billing_service = create_billing_service(
            self.pricing_service,
        )

        self.image_storage = create_image_storage()

        self.image_processor = create_image_processor()

        self.listing_image_service = create_listing_image_service(
            image_storage=self.image_storage,
            image_processor=self.image_processor,
            max_images=settings.image_max_count_per_listing,
            url_expiration_seconds=settings.image_url_expiration_seconds,
        )

        self.listing_service = create_listing_service(
            billing_service=self.billing_service,
            listing_image_service=self.listing_image_service,
        )

        self.wanted_post_service = create_wanted_post_service(
            billing_service=self.billing_service,
        )

        self.transaction_service = create_transaction_service(
            billing_service=self.billing_service,
        )

        self.payment_service = create_payment_service()

        self.feedback_service = create_feedback_service()

        # =========================================================================
        # Full-platform services
        #
        # The attributes retain their real types for the rest of the application,
        # but their actual objects are only constructed outside marketplace-only
        # mode.
        # =========================================================================

        self.road_design_agent = cast("RoadDesignAgent", None)
        self.whatsapp_agent = cast("WhatsAppAssistant", None)
        self.email_agent = cast("EmailAssistant", None)
        self.agent_router = cast("AgentRouter", None)
        self.agent_service = cast("AgentService", None)
        self.chat_service = cast("ChatService", None)
        self.history_service = cast("HistoryService", None)
        self.whatsapp_client = cast("WhatsAppClient", None)
        self.transcription_client = cast("TranscriptionClient", None)
        self.whatsapp_service = cast("WhatsAppService", None)
        self.draft_service = cast("DraftService", None)
        self.memory_service = cast("MemoryService", None)

        if not settings.MARKETPLACE_ONLY:
            from app.core.factories import (
                create_agent_router,
                create_agent_service,
                create_chat_service,
                create_draft_service,
                create_email_agent,
                create_history_service,
                create_memory_service,
                create_road_design_agent,
                create_transcription_client,
                create_whatsapp_agent,
                create_whatsapp_client,
                create_whatsapp_service,
            )

            self.road_design_agent = create_road_design_agent()

            self.whatsapp_agent = create_whatsapp_agent()

            self.email_agent = create_email_agent()

            self.agent_router = create_agent_router(
                road_agent=self.road_design_agent,
                whatsapp_agent=self.whatsapp_agent,
                email_agent=self.email_agent,
            )

            self.agent_service = create_agent_service(
                self.agent_router,
            )

            self.chat_service = create_chat_service(
                self.agent_service,
            )

            self.history_service = create_history_service()

            self.whatsapp_client = create_whatsapp_client()

            self.transcription_client = create_transcription_client()

            self.whatsapp_service = create_whatsapp_service(
                agent_service=self.agent_service,
                whatsapp_client=self.whatsapp_client,
                transcription_client=self.transcription_client,
            )

            self.draft_service = create_draft_service(
                whatsapp_service=self.whatsapp_service,
            )

            self.memory_service = create_memory_service()

    async def initialize(self) -> None:
        if settings.MARKETPLACE_ONLY:
            return

        await asyncio.gather(
            self.road_design_agent.initialize(),
            self.whatsapp_agent.initialize(),
            self.email_agent.initialize(),
            self.whatsapp_client.initialize(),
        )

    async def shutdown(self) -> None:
        if settings.MARKETPLACE_ONLY:
            return

        await self.whatsapp_client.close()


container = Container()