from app.config.settings import settings

# Logical name -> real provider model.
#
# Agents reference only the logical name.
# Changing the actual provider/model therefore requires
# changing this file, not individual agents.
MODEL_MAP = {
    "primary-agent-model": "groq/qwen/qwen3.6-27b",
}


# Fallback models are attempted in this order.
#
# Primary:
#     Groq
#
# Fallback 1:
#     OpenAI
#
# Fallback 2:
#     Anthropic
#
# Because these are different providers, a failure at one
# provider does not automatically imply that the others are down.
FALLBACK_CHAIN = [
    "openai/gpt-4o-mini",
    "anthropic/claude-haiku-4-5-20251001",
]


# Provider-specific credentials.
#
# LiteLLM normally resolves these from the corresponding
# environment variables. Keeping this mapping here gives
# the application an explicit representation of which
# credential belongs to which provider.
API_KEYS = {
    "groq": settings.GROQ_API_KEY,
    "openai": settings.OPENAI_API_KEY,
    "anthropic": settings.ANTHROPIC_API_KEY,
}
