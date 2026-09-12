from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from litellm.litellm_core_utils.logging_worker import GLOBAL_LOGGING_WORKER

from app.api.routes import (
    chat,
    documents,
    donations,
    drafts,
    feedback,
    health,
    history,
    mpesa_webhook,
    payments,
    whatsapp_webhook,
)
from app.api.routes.auth import register_auth_routes
from app.cache import configure_cache
from app.config.settings import settings
from app.core.container import container
from app.llm.gateway import (
    register_llm_callbacks,
    unregister_llm_callbacks,
)
from app.marketplace.routes import listings, transactions, wanted_posts


@asynccontextmanager
async def lifespan(app: FastAPI):

    configure_cache()

    register_llm_callbacks()

    # Initialize AI services
    await container.initialize()

    yield

    unregister_llm_callbacks()
    await GLOBAL_LOGGING_WORKER.stop()


def create_application() -> FastAPI:

    api = FastAPI(
        lifespan=lifespan,
        title="AI Agents Services API",
        version="1.0.0",
    )

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

    api.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # API routes
    api.include_router(health.router)
    api.include_router(chat.router)
    api.include_router(history.router)
    api.include_router(documents.router)
    api.include_router(whatsapp_webhook.router)
    api.include_router(drafts.router)

    #Marketplace routes
    api.include_router(listings.router)
    api.include_router(wanted_posts.router)
    api.include_router(transactions.router)
    api.include_router(mpesa_webhook.router)
    api.include_router(donations.router)
    api.include_router(payments.router)


    # Authentication routes
    register_auth_routes(api)

    # Feedback route
    api.include_router(feedback.router)

    return api


api = create_application()

