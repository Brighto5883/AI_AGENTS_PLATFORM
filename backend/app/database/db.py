from sqlalchemy.orm import DeclarativeBase
from app.database.session import engine


class Base(DeclarativeBase):
    pass

async def create_db_and_tables():
    import app.database.models  # noqa: F401 — registers all models on Base.metadata
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

