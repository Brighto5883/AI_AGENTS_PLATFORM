from sqlalchemy.engine import URL, make_url


def get_async_database_url(database_url: str) -> URL:
    """Return a PostgreSQL SQLAlchemy URL configured for asyncpg."""
    normalized = database_url.strip()

    if not normalized:
        raise ValueError("DATABASE_URL is empty.")

    # Railway and other providers may use the legacy postgres:// scheme.
    if normalized.startswith("postgres://"):
        normalized = "postgresql://" + normalized[len("postgres://") :]

    # Parse the URL first so SQLAlchemy handles credentials,
    # URL encoding, host, port, and database name correctly.
    try:
        url = make_url(normalized)
    except Exception as exc:
        raise ValueError(
            "DATABASE_URL is not a valid SQLAlchemy database URL."
        ) from exc

    if url.get_backend_name() != "postgresql":
        raise ValueError(
            "DATABASE_URL must use PostgreSQL for the async application database."
        )

    # Always use asyncpg for the application's async SQLAlchemy engine.
    return url.set(drivername="postgresql+asyncpg")