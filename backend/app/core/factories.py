from pathlib import Path

from app.agents.email_agent import EmailAssistant
from app.agents.road_design_agent import RoadDesignAgent
from app.agents.whatsapp_agent import WhatsAppAssistant
from app.billing.billing_service import BillingService
from app.config.settings import settings
from app.integrations.whatsapp.client import WhatsAppClient
from app.integrations.whatsapp.transcription import TranscriptionClient
from app.marketplace.media.image_processing import ImageProcessor
from app.marketplace.media.image_storage import ImageStorage
from app.marketplace.media.local_image_storage import LocalImageStorage
from app.marketplace.media.r2_image_storage import R2ImageStorage
from app.marketplace.services.listing_image_service import ListingImageService
from app.marketplace.services.listing_service import ListingService
from app.marketplace.services.marketplace_payment_success_handler import (
    MarketplacePaymentSuccessHandler,
)
from app.marketplace.services.transaction_service import TransactionService
from app.marketplace.services.wanted_post_service import WantedPostService
from app.memory.service import MemoryService
from app.payments.enums import PaymentProviderType
from app.payments.payment_service import PaymentService
from app.payments.providers.mpesa_payment_provider import MpesaPaymentProvider
from app.pricing.marketplace_pricing_service import MarketplacePricingService
from app.routing.agent_router import AgentRouter
from app.services.agent_service import AgentService
from app.services.chat_service import ChatService
from app.services.draft_service import DraftService
from app.services.feedback_service import FeedbackService
from app.services.history_service import HistoryService
from app.services.whatsapp_service import WhatsAppService


def create_road_design_agent():

    return RoadDesignAgent()

def create_whatsapp_agent():
    return WhatsAppAssistant()

def create_email_agent():
    return EmailAssistant()

def create_whatsapp_client():
    return WhatsAppClient()

def create_agent_service(router):

    return AgentService(router)

def create_agent_router(
    road_agent,
    whatsapp_agent,
    email_agent,
):
    return AgentRouter(
        road_agent=road_agent,
        whatsapp_agent=whatsapp_agent,
        email_agent=email_agent,
    )


def create_chat_service(agent_service):

    return ChatService(
        agent_service
    )


def create_history_service():

    return HistoryService()


def create_whatsapp_service(agent_service, whatsapp_client, transcription_client):
    return WhatsAppService(
        agent_service=agent_service,
        whatsapp_client=whatsapp_client,
        transcription_client=transcription_client
    )

def create_draft_service(whatsapp_service):
    return DraftService(
        whatsapp_service=whatsapp_service
    )

def create_transcription_client():
    return TranscriptionClient()

def create_memory_service():
    return MemoryService()


def create_wanted_post_service():
    return WantedPostService()


def create_pricing_service():
    return MarketplacePricingService()


def create_transaction_service(pricing_service):
    return TransactionService(
        pricing_service=pricing_service,
)


def create_billing_service(pricing_service):
    return BillingService(
        pricing_service=pricing_service,
    )
    

def create_image_storage() -> ImageStorage:
    if settings.image_storage_backend == "local":
        return LocalImageStorage(
            base_directory=Path(settings.local_media_directory),
            base_url=settings.local_media_base_url,
        )

    elif settings.image_storage_backend == 'r2':
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

def create_image_processor():
    return ImageProcessor(
        max_upload_size_bytes=settings.MAX_UPLOAD_SIZE_BYTES,
        max_width=settings.image_max_width,
        max_height=settings.image_max_height,
    )

def create_listing_image_service(
    image_storage,
    image_processor,
    max_images,
    url_expiration_seconds,
):
    return ListingImageService(
        image_storage=image_storage,
        image_processor=image_processor,
        max_images=max_images,
        url_expiration_seconds=url_expiration_seconds,
    )


def create_listing_service(
    billing_service, 
    listing_image_service,
):
    return ListingService(
        billing_service=billing_service,
        listing_image_service = listing_image_service,
    )


def create_payment_service() -> PaymentService:
    mpesa_provider = MpesaPaymentProvider()

    marketplace_payment_success_handler = MarketplacePaymentSuccessHandler()

    return PaymentService(
        providers={
            PaymentProviderType.MPESA: mpesa_provider,
        },

        payment_success_handlers = [
            marketplace_payment_success_handler,
        ]
    )

def create_feedback_service() -> FeedbackService:
    return FeedbackService()