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
    MAX_MARKETPLACE_IMAGES: int = 5

    # Marketplace moderation
    GEMINI_SCANNER_MODEL: str = "gemini-2.5-flash-lite"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()  # pyright: ignore[reportCallIssue]
