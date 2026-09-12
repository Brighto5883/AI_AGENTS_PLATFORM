from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
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
    DATABASE_URL: str = 'postgresql+asyncpg://roadagent:devpassword@localhost:5432/roadagent_db'

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

    #UPLOAD_SIZES
    MAX_UPLOAD_SIZE_BYTES: int = 20 * 1024 * 1024

        # Marketplace media
    MAX_MARKETPLACE_IMAGE_SIZE_BYTES: int = 10 * 1024 * 1024

    # Marketplace moderation
    GEMINI_SCANNER_MODEL: str = "gemini-2.5-flash-lite"
    
    # DARAJA YA PESA
    MPESA_CONSUMER_KEY: str
    MPESA_CONSUMER_SECRET: str
    MPESA_SHORTCODE: str
    MPESA_PASSKEY: str
    MPESA_CALLBACK_URL: str
    MPESA_BASE_URL: str

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
