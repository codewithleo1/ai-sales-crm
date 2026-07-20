"""
Database engine and session factory.
All database access in the app goes through get_db().
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# Create the async engine — this is the connection to Supabase PostgreSQL
engine = create_async_engine(
    settings.database_url,
    echo=settings.environment == "development",  # logs SQL in dev only
    pool_size=5,
    max_overflow=10,
)

# Session factory — creates new sessions when called
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class that all ORM models will inherit from."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency that provides a database session to route handlers.
    Automatically closes the session when the request is done.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise