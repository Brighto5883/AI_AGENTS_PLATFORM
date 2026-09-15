from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.middleware import RequestContextMiddleware
from app.api.routes import feedback, health, payments, paystack_webhook
from app.api.routes.auth import register_auth_routes
from app.config.settings import settings
from app.core.container import container
from app.marketplace.routes import (
    billing,
    listings,
    transactions,
    wanted_posts,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.MARKETPLACE_ONLY:
        await container.initialize()

        try:
            yield
        finally:
            await container.shutdown()

        return

    from app.cache import configure_cache
    from app.llm.gateway import register_llm_callbacks

    configure_cache()
    register_llm_callbacks()

    await container.initialize()

    try:
        yield
    finally:
        from litellm.litellm_core_utils.logging_worker import (
            GLOBAL_LOGGING_WORKER,
        )

        from app.llm.gateway import unregister_llm_callbacks

        unregister_llm_callbacks()

        await container.shutdown()

        await GLOBAL_LOGGING_WORKER.stop()


def create_application() -> FastAPI:
    api = FastAPI(
        lifespan=lifespan,
        title="Agentic Campus Services API",
        version="1.0.0",
    )

    api.add_middleware(RequestContextMiddleware)

    api.add_middleware(
        CORSMiddleware,
        allow_origins=[
            origin.strip()
            for origin in settings.CORS_ORIGINS.split(",")
            if origin.strip()
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # =========================================================================
    # Core routes
    # =========================================================================

    api.include_router(health.router)

    register_auth_routes(api)

    api.include_router(feedback.router)

    # =========================================================================
    # Marketplace routes
    # =========================================================================

    api.include_router(listings.router)
    api.include_router(wanted_posts.router)
    api.include_router(transactions.router)
    api.include_router(billing.router)

    api.include_router(payments.router)
    api.include_router(paystack_webhook.router)

    # =========================================================================
    # Full-platform routes
    # =========================================================================

    if not settings.MARKETPLACE_ONLY:
        from app.api.routes import (
            chat,
            documents,
            donations,
            drafts,
            history,
            mpesa_webhook,
            whatsapp_webhook,
        )

        api.include_router(chat.router)
        api.include_router(history.router)
        api.include_router(documents.router)
        api.include_router(whatsapp_webhook.router)
        api.include_router(drafts.router)
        api.include_router(mpesa_webhook.router)
        api.include_router(donations.router)

    # =========================================================================
    # Local media is only exposed when local storage is actually selected.
    # Production marketplace should use R2.
    # =========================================================================

    if settings.image_storage_backend == "local":
        media_directory = Path(settings.local_media_directory)

        media_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        api.mount(
            "/media",
            StaticFiles(directory=media_directory),
            name="media",
        )

    return api


api = create_application()