import logging

import litellm
from langchain_litellm import ChatLiteLLM
from langchain_litellm.chat_models.litellm import _create_retry_decorator
from litellm.integrations.custom_logger import CustomLogger

from app.agent.context import agent_context
from app.database.models.llm_usage_log import LLMUsageLog
from app.database.session import get_session_context
from app.llm.model_config import FALLBACK_CHAIN, MODEL_MAP

litellm.turn_off_message_logging = True

class FallbackChatLiteLLM(ChatLiteLLM):
    """
    ChatLiteLLM with application-level model fallback support.

    The normal ChatLiteLLM implementation calls:

        self.client.acompletion(...)

    This subclass instead routes the completion through LiteLLM's
    fallback mechanism:

        primary model
            ↓ failure
        fallback 1
            ↓ failure
        fallback 2
    """

    def completion_with_retry(
        self,
        run_manager=None,
        **kwargs,
    ):
        """Run a synchronous completion with model fallbacks."""

        retry_decorator = _create_retry_decorator(
            self,
            run_manager=run_manager,
        )

        @retry_decorator
        def _completion_with_retry(**completion_kwargs):
            return litellm.completion_with_fallbacks(
                **completion_kwargs,
                kwargs={
                    "fallbacks": FALLBACK_CHAIN,
                },
            )

        return _completion_with_retry(**kwargs)

    async def acompletion_with_retry(
        self,
        run_manager=None,
        **kwargs,
    ):
        """Run an asynchronous completion with model fallbacks."""

        retry_decorator = _create_retry_decorator(
            self,
            run_manager=run_manager,
        )

        @retry_decorator
        async def _completion_with_retry(**completion_kwargs):
            return await litellm.async_completion_with_fallbacks(
                **completion_kwargs,
                kwargs={
                    "fallbacks": FALLBACK_CHAIN,
                },
            )

        return await _completion_with_retry(**kwargs)


def build_llm(
    logical_model_name: str,
    temperature: float = 0,
) -> ChatLiteLLM:
    """
    Every agent calls this instead of constructing ChatLiteLLM directly.

    Resolves the logical model name to a real provider model and returns
    an LLM with automatic cross-provider fallback.
    """

    real_model = MODEL_MAP[logical_model_name]

    return FallbackChatLiteLLM(
        model=real_model,
        temperature=temperature,
    )



logger = logging.getLogger(__name__)

class UsageLogger(CustomLogger):
    """
    Persists every LLM completion attempt to LLMUsageLog.
 
    litellm's GLOBAL_LOGGING_WORKER awaits async_log_success_event /
    async_log_failure_event directly, so this never blocks the request
    path and needs no manual asyncio bridging. A logging failure here
    must never break the calling agent — every DB write is wrapped.
    """
 
    async def _persist(
        self,
        *,
        status: str,
        model: str | None,
        cost,
        duration: float | None,
        prompt_tokens: int | None,
        completion_tokens: int | None,
        total_tokens: int | None,
        error_message: str | None,
    ) -> None:
        ctx = agent_context.get() or {}
 
        try:
            async with get_session_context() as session:
                session.add(
                    LLMUsageLog(
                        user_id=ctx.get("user_id"),
                        agent_name=ctx.get("agent_name", "unknown"),
                        conversation_id=ctx.get("conversation_id"),
                        model=model,
                        cost=cost,
                        duration_seconds=duration,
                        prompt_tokens=prompt_tokens,
                        completion_tokens=completion_tokens,
                        total_tokens=total_tokens,
                        status=status,
                        error_message=error_message,
                    )
                )
                await session.commit()
        except Exception:
            # Never let a logging failure surface as an agent/request failure.
            logger.exception("Failed to persist LLMUsageLog")
 
    async def async_log_success_event(self, kwargs, response_obj, start_time, end_time):
        standard_logging = kwargs.get("standard_logging_object") or {}
        usage = standard_logging.get("usage") or {}
 
        await self._persist(
            status="success",
            model=kwargs.get("model"),
            cost=standard_logging.get("response_cost") or kwargs.get("response_cost"),
            duration=(end_time - start_time).total_seconds() if start_time and end_time else None,
            prompt_tokens=usage.get("prompt_tokens"),
            completion_tokens=usage.get("completion_tokens"),
            total_tokens=usage.get("total_tokens"),
            error_message=None,
        )
 
    async def async_log_failure_event(self, kwargs, response_obj, start_time, end_time):
        exception = kwargs.get("exception")
 
        await self._persist(
            status="failure",
            model=kwargs.get("model"),
            cost=None,
            duration=(end_time - start_time).total_seconds() if start_time and end_time else None,
            prompt_tokens=None,
            completion_tokens=None,
            total_tokens=None,
            error_message=str(exception) if exception else None,
        )
 
 
_usage_logger = UsageLogger()
 
 
def register_llm_callbacks():
    """Called once during FastAPI startup."""
    litellm.callbacks = [_usage_logger]
 
 
def unregister_llm_callbacks():
    """Called during FastAPI shutdown."""
    litellm.callbacks = []
