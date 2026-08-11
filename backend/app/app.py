from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.cache import configure_cache
from app.core.container import container
from app.database.db import create_db_and_tables

from app.api.routes.auth import register_auth_routes
from app.api.routes import (
    health,
    chat,
    history,
    documents,
    drafts,
    whatsapp_webhook,
)


@asynccontextmanager
async def lifespan(app: FastAPI):

    configure_cache()

    await create_db_and_tables()

    # Initialize AI services
    await container.initialize()

    yield


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

    # Authentication routes
    register_auth_routes(api)

    return api


api = create_application()

