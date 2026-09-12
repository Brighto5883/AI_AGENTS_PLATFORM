import asyncio

from app.config.settings import settings
from app.core.factories import (
    create_agent_router,
    create_agent_service,
    create_billing_service,
    create_chat_service,
    create_draft_service,
    create_email_agent,
    create_feedback_service,
    create_history_service,
    create_image_processor,
    create_image_storage,
    create_listing_image_service,
    create_listing_service,
    create_memory_service,
    create_payment_service,
    create_pricing_service,
    create_road_design_agent,
    create_transaction_service,
    create_transcription_client,
    create_wanted_post_service,
    create_whatsapp_agent,
    create_whatsapp_client,
    create_whatsapp_service,
)


class Container:

    def __init__(self):

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
            self.agent_service
        )

        self.history_service = create_history_service()

        self.whatsapp_client = create_whatsapp_client()

        self.transcription_client = create_transcription_client()

        self.whatsapp_service = create_whatsapp_service(
            agent_service = self.agent_service,
            whatsapp_client=self.whatsapp_client,
            transcription_client = self.transcription_client,
        )

        self.draft_service = create_draft_service(
            whatsapp_service=self.whatsapp_service
        )

        self.memory_service = create_memory_service()

        self.pricing_service = create_pricing_service()

        self.billing_service = create_billing_service(self.pricing_service)

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

    async def initialize(self):
        await asyncio.gather(
            self.road_design_agent.initialize(),
            self.whatsapp_agent.initialize(),
            self.email_agent.initialize(),
            self.whatsapp_client.initialize(),
        )


container = Container()
