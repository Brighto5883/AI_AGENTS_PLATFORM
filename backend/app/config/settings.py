from decimal import Decimal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    APP_ENV: str = "development"

    MARKETPLACE_ONLY: bool = False

    # Infrastructure
    ENABLE_CACHE: bool = False
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

     # AI Providers
    ANTHROPIC_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    GROQ_API_KEY: str | None = None

    # Database
    DATABASE_URL: str

    # RAG
    PAGEINDEX_API_KEY: str | None = None
    TAVILY_API_KEY: str | None = None
    # LangSmith
    LANGSMITH_API_KEY: str | None = None
    LANGSMITH_ENDPOINT: str | None = None
    # Hugging Face
    HF_TOKEN: str | None = None

    # Authentication
    JWT_SECRET: str

    #YOUTUBE
    YOUTUBE_API_KEY: str | None = None

    #WhatsApp Messaging
    WHATSAPP_PHONE_NUMBER_ID: str | None = None
    WHATSAPP_ACCESS_TOKEN: str | None = None
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: str | None = None
    WHATSAPP_APP_SECRET: str | None = None

    #UPLOAD_SIZES
    MAX_UPLOAD_SIZE_BYTES: int = 20 * 1024 * 1024

        # Marketplace media
    MAX_MARKETPLACE_IMAGE_SIZE_BYTES: int = 10 * 1024 * 1024

    # Marketplace billing
    # Keep disabled during the free-launch period. Enabling this is the main
    # switch that turns the configured billing modes on for users.
    marketplace_billing_enabled: bool = False
    marketplace_default_billing_mode: str = "connection_fee"
    marketplace_currency: str = "KES"
    marketplace_subscription_monthly_fee: Decimal = Decimal("549.00")
    marketplace_connection_fee: Decimal = Decimal("25.00")
    marketplace_listing_fee_per_item: Decimal = Decimal("25.00")
    marketplace_billing_notice_title: str = "Marketplace is currently free"
    marketplace_billing_notice_message: str = (
        "You can currently include contact details in selling listings. "
        "When paid marketplace services begin, contact sharing in listings may be restricted."
        "Wanted Posts remain free to create, but contact details are protected so sellers can connect through the marketplace.."
    )

    # Marketplace moderation
    GEMINI_SCANNER_MODEL: str = "gemini-2.5-flash-lite"
    
    # DARAJA YA PESA
    MPESA_CONSUMER_KEY: str | None = None
    MPESA_CONSUMER_SECRET: str | None = None
    MPESA_SHORTCODE: str | None = None
    MPESA_PASSKEY: str | None = None
    MPESA_CALLBACK_URL: str | None = None
    MPESA_CALLBACK_TOKEN: str | None = None
    MPESA_BASE_URL: str | None = None
    MPESA_TILL_NUMBER: str | None = None

    MPESA_TRANSACTION_TYPE: str = "CustomerPayBillOnline"

    # PAYSTACK PESA
    PAYSTACK_ENABLED: bool = False
    PAYSTACK_SECRET_KEY: str | None = None
    PAYSTACK_PUBLIC_KEY: str | None = None
    PAYSTACK_CURRENCY: str = "KES"

    # Browser clients. Native mobile clients do not use CORS.
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:8081"

    # R2 IMAGE UPLOAD
    r2_endpoint_url: str
    r2_access_key_id: str
    r2_secret_access_key: str
    r2_bucket_name: str
    r2_region: str = "auto"

    image_max_upload_size_mb: int = 10
    image_max_width: int = 4096
    image_max_height: int = 4096
    image_max_count_per_listing: int = 5

    image_url_expiration_seconds: int = 3600

    # LOCAL IMAGE STORAGE
    image_storage_backend: str = "local"

    local_media_directory: str = "storage"

    local_media_base_url: str = "http://localhost:8000"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_full_platform_credentials(self) -> "Settings":
        if self.MARKETPLACE_ONLY:
            return self

        required = {
            "ANTHROPIC_API_KEY": self.ANTHROPIC_API_KEY,
            "GEMINI_API_KEY": self.GEMINI_API_KEY,
            "OPENAI_API_KEY": self.OPENAI_API_KEY,
            "GROQ_API_KEY": self.GROQ_API_KEY,
            "PAGEINDEX_API_KEY": self.PAGEINDEX_API_KEY,
            "TAVILY_API_KEY": self.TAVILY_API_KEY,
            "LANGSMITH_API_KEY": self.LANGSMITH_API_KEY,
            "LANGSMITH_ENDPOINT": self.LANGSMITH_ENDPOINT,
            "HF_TOKEN": self.HF_TOKEN,
            "YOUTUBE_API_KEY": self.YOUTUBE_API_KEY,
            "WHATSAPP_PHONE_NUMBER_ID": self.WHATSAPP_PHONE_NUMBER_ID,
            "WHATSAPP_ACCESS_TOKEN": self.WHATSAPP_ACCESS_TOKEN,
            "WHATSAPP_WEBHOOK_VERIFY_TOKEN": self.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
            "MPESA_CONSUMER_KEY": self.MPESA_CONSUMER_KEY,
            "MPESA_CONSUMER_SECRET": self.MPESA_CONSUMER_SECRET,
            "MPESA_SHORTCODE": self.MPESA_SHORTCODE,
            "MPESA_PASSKEY": self.MPESA_PASSKEY,
            "MPESA_CALLBACK_URL": self.MPESA_CALLBACK_URL,
            "MPESA_BASE_URL": self.MPESA_BASE_URL,
        }

        missing = [
            name
            for name, value in required.items()
            if not value
        ]

        if missing:
            raise ValueError(
                "Missing required full-platform settings: "
                + ", ".join(missing)
            )

        return self




settings = Settings()  # pyright: ignore[reportCallIssue]
