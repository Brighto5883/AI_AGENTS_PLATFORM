import litellm
from app.agent.context import agent_context
from app.llm.model_config import FALLBACK_CHAIN, MODEL_MAP
from langchain_litellm import ChatLiteLLM


def build_llm(logical_model_name: str, temperature: float = 0) -> ChatLiteLLM:
    """
    Every agent calls this instead of constructing ChatLiteLLM directly.
    Resolves the logical name to a real model + attaches the fallback
    chain, so every agent gets automatic cross-provider fallback for free.
    """
    real_model = MODEL_MAP[logical_model_name]

    return ChatLiteLLM(
        model=real_model,
        temperature=temperature,
        fallbacks=FALLBACK_CHAIN,
    )


def _log_llm_cost(kwargs, completion_response, start_time, end_time):
    """
    LiteLLM calls this after every completion, success or fallback.
    Reads attribution (user_id, agent, conversation_id) from the same
    ContextVar already used for tool-arg injection — same mechanism,
    reused here for a different purpose.
    """
    ctx = agent_context.get() or {}

    cost = kwargs.get("response_cost")
    model = kwargs.get("model")
    duration = (end_time - start_time).total_seconds() if start_time and end_time else None

    # TODO: write to LLMUsageLog table — needs its own DB session,
    # which this synchronous callback doesn't have. See note below.
    print(f"[llm cost] model={model} cost={cost} duration={duration}s "
          f"conversation_id={ctx.get('conversation_id')} user_id={ctx.get('user_id')}")


def register_llm_callbacks():
    """Call once at startup (container.initialize())."""
    litellm.success_callback = [_log_llm_cost]
