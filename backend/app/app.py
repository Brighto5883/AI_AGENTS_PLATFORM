from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from litellm.litellm_core_utils.logging_worker import GLOBAL_LOGGING_WORKER

from app.api.routes import (
    chat,
    documents,
    drafts,
    health,
    history,
    whatsapp_webhook,
)
from app.api.routes.auth import register_auth_routes
from app.cache import configure_cache
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

    # Authentication routes
    register_auth_routes(api)

    return api


api = create_application()

