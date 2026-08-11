# app/database/session.py

from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.config.settings import settings

DATABASE_URL = settings.DATABASE_URL

engine = create_async_engine(DATABASE_URL)

async_session_maker = async_sessionmaker(
    engine,
    expire_on_commit=False
)

async def get_async_session():
    """FastAPI dependency form — used in routes via Depends()."""
    async with async_session_maker() as session:
        yield session


@asynccontextmanager
async def get_session_context():
    """
    Standalone form for use outside FastAPI's DI system —
    MCP tools, scripts, background tasks. Usage:

        async with get_session_context() as db:
            ...
    """
    async with async_session_maker() as session:
        yield session