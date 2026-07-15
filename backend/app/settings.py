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

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()