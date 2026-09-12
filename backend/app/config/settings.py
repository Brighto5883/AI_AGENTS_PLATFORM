from decimal import Decimal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    # Infrastructure
    ENABLE_CACHE: bool = False
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

     # AI Providers
    ANTHROPIC_API_KEY: str
    GEMINI_API_KEY: str
    OPENAI_API_KEY: str
    GROQ_API_KEY: str

    # Database
    DATABASE_URL: str

    # RAG
    PAGEINDEX_API_KEY: str
    TAVILY_API_KEY: str

    # LangSmith
    LANGSMITH_API_KEY: str
    LANGSMITH_ENDPOINT: str

    # Hugging Face
    HF_TOKEN: str

    # Authentication
    JWT_SECRET: str

    #YOUTUBE
    YOUTUBE_API_KEY: str

    #WhatsApp Messaging
    WHATSAPP_PHONE_NUMBER_ID: str
    WHATSAPP_ACCESS_TOKEN: str
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: str
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
        "The marketplace is currently free while we prepare paid plans. "
        "We will notify you before charges are introduced."
    )

    # Marketplace moderation
    GEMINI_SCANNER_MODEL: str = "gemini-2.5-flash-lite"
    
    # DARAJA YA PESA
    MPESA_CONSUMER_KEY: str
    MPESA_CONSUMER_SECRET: str
    MPESA_SHORTCODE: str
    MPESA_PASSKEY: str
    MPESA_CALLBACK_URL: str
    MPESA_CALLBACK_TOKEN: str | None = None
    MPESA_BASE_URL: str

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


settings = Settings()  # pyright: ignore[reportCallIssue]
