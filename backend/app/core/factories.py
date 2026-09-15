from __future__ import annotations

from pathlib import Path

from app.billing.billing_service import BillingService
from app.config.settings import settings
from app.marketplace.media.image_processing import ImageProcessor
from app.marketplace.media.image_storage import ImageStorage
from app.marketplace.media.local_image_storage import LocalImageStorage
from app.marketplace.media.r2_image_storage import R2ImageStorage
from app.marketplace.services.listing_image_service import ListingImageService
from app.marketplace.services.marketplace_payment_success_handler import (
    MarketplacePaymentSuccessHandler,
)
from app.marketplace.services.transaction_service import TransactionService
from app.marketplace.services.wanted_post_service import WantedPostService
from app.payments.enums import PaymentProviderType
from app.payments.payment_provider import PaymentProvider
from app.payments.payment_service import PaymentService
from app.payments.providers.paystack_payment_provider import (
    PaystackPaymentProvider,
)
from app.pricing.marketplace_pricing_service import MarketplacePricingService
from app.services.feedback_service import FeedbackService

# =============================================================================
# FULL PLATFORM FACTORIES
#
# AI/WhatsApp imports intentionally remain inside these functions so that
# marketplace-only production does not import the full AI stack.
# =============================================================================


def create_road_design_agent():
    from app.agents.road_design_agent import RoadDesignAgent

    return RoadDesignAgent()


def create_whatsapp_agent():
    from app.agents.whatsapp_agent import WhatsAppAssistant

    return WhatsAppAssistant()


def create_email_agent():
    from app.agents.email_agent import EmailAssistant

    return EmailAssistant()


def create_whatsapp_client():
    from app.integrations.whatsapp.client import WhatsAppClient

    return WhatsAppClient()


def create_agent_service(router):
    from app.services.agent_service import AgentService

    return AgentService(router)


def create_agent_router(
    road_agent,
    whatsapp_agent,
    email_agent,
):
    from app.routing.agent_router import AgentRouter

    return AgentRouter(
        road_agent=road_agent,
        whatsapp_agent=whatsapp_agent,
        email_agent=email_agent,
    )


def create_chat_service(agent_service):
    from app.services.chat_service import ChatService

    return ChatService(agent_service)


def create_history_service():
    from app.services.history_service import HistoryService

    return HistoryService()


def create_whatsapp_service(
    agent_service,
    whatsapp_client,
    transcription_client,
):
    from app.services.whatsapp_service import WhatsAppService

    return WhatsAppService(
        agent_service=agent_service,
        whatsapp_client=whatsapp_client,
        transcription_client=transcription_client,
    )


def create_draft_service(whatsapp_service):
    from app.services.draft_service import DraftService

    return DraftService(
        whatsapp_service=whatsapp_service,
    )


def create_transcription_client():
    from app.integrations.whatsapp.transcription import TranscriptionClient

    return TranscriptionClient()


def create_memory_service():
    from app.memory.service import MemoryService

    return MemoryService()


# =============================================================================
# MARKETPLACE FACTORIES
# =============================================================================


def create_pricing_service() -> MarketplacePricingService:
    return MarketplacePricingService()


def create_billing_service(
    pricing_service: MarketplacePricingService,
) -> BillingService:
    return BillingService(
        pricing_service=pricing_service,
    )


def create_wanted_post_service(
    billing_service: BillingService,
) -> WantedPostService:
    return WantedPostService(
        billing_service=billing_service,
    )


def create_transaction_service(
    billing_service: BillingService,
) -> TransactionService:
    return TransactionService(
        billing_service=billing_service,
    )


def create_image_storage() -> ImageStorage:
    if settings.image_storage_backend == "local":
        return LocalImageStorage(
            base_directory=Path(settings.local_media_directory),
            base_url=settings.local_media_base_url,
        )

    if settings.image_storage_backend == "r2":
        return R2ImageStorage(
            endpoint_url=settings.r2_endpoint_url,
            access_key_id=settings.r2_access_key_id,
            secret_access_key=settings.r2_secret_access_key,
            bucket_name=settings.r2_bucket_name,
            region=settings.r2_region,
        )

    raise ValueError(
        f"Unsupported image storage backend: "
        f"{settings.image_storage_backend}"
    )


def create_image_processor() -> ImageProcessor:
    return ImageProcessor(
        max_upload_size_bytes=settings.MAX_MARKETPLACE_IMAGE_SIZE_BYTES,
        max_width=settings.image_max_width,
        max_height=settings.image_max_height,
    )


def create_listing_image_service(
    image_storage: ImageStorage,
    image_processor: ImageProcessor,
    max_images: int,
    url_expiration_seconds: int,
) -> ListingImageService:
    image_scanner = None

    if settings.marketplace_billing_enabled:
        from app.marketplace.moderation.image_scanner import (
            ImageContactScanner,
        )

        image_scanner = ImageContactScanner()

    return ListingImageService(
        image_storage=image_storage,
        image_processor=image_processor,
        max_images=max_images,
        url_expiration_seconds=url_expiration_seconds,
        image_scanner=image_scanner,
    )


def create_listing_service(
    billing_service: BillingService,
    listing_image_service: ListingImageService,
):
    from app.marketplace.services.listing_service import ListingService

    return ListingService(
        billing_service=billing_service,
        listing_image_service=listing_image_service,
    )


def create_payment_service() -> PaymentService:
    providers: dict[PaymentProviderType, PaymentProvider] = {
        PaymentProviderType.PAYSTACK: PaystackPaymentProvider(),
    }

    if not settings.MARKETPLACE_ONLY:
        from app.payments.providers.mpesa_payment_provider import (
            MpesaPaymentProvider,
        )

        providers[PaymentProviderType.MPESA] = MpesaPaymentProvider()

    return PaymentService(
        providers=providers,
        payment_success_handlers=[
            MarketplacePaymentSuccessHandler(),
        ],
    )


def create_feedback_service() -> FeedbackService:
    return FeedbackService()