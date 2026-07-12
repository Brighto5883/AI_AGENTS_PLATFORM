import uuid
from datetime import datetime

from collections.abc import AsyncGenerator
from click import argument
from fastapi import Depends
from sqlalchemy import Column, ForeignKey, String, Text, Float, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from fastapi_users.db import SQLAlchemyUserDatabase, SQLAlchemyBaseUserTableUUID

DATABASE_URL = 'sqlite+aiosqlite:///./test.db'

class Base(DeclarativeBase):
    pass

class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "users"
    queries = relationship("QueryHistory", back_populates="user")

class QueryHistory(Base):
    __tablename__ = 'query_history'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    query = Column(Text, nullable=False)
    method = Column(String, nullable=False)
    answer = Column(Text, nullable=False)
    document = Column(String, nullable=False)
    cost = Column(Float, nullable=False)

    user = relationship("User", back_populates="queries")

engine = create_async_engine(DATABASE_URL)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)

async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session

async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)