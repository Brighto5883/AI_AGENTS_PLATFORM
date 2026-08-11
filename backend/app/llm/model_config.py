from app.config.settings import settings

# Logical name -> real provider model. Agents reference the logical
# name only; swapping providers means editing this file, never agent code.
MODEL_MAP = {
    "primary-agent-model": "groq/llama-3.3-70b-versatile",
}

# Fallback chain, in order, tried if the primary model errors/times out/rate-limits.
# Cross-provider deliberately — if Groq has an outage, OpenAI/Anthropic
# being a different provider means it's very unlikely to be down at the same time.
FALLBACK_CHAIN = [
    "openai/gpt-4o-mini",
    "anthropic/claude-haiku-4-5-20251001",
]

API_KEYS = {
    "groq": settings.GROQ_API_KEY,
    "openai": settings.OPENAI_API_KEY,
    "anthropic": settings.ANTHROPIC_API_KEY,
}