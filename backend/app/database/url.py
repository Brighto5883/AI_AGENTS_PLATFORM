from sqlalchemy.engine import URL, make_url


def get_async_database_url(database_url: str) -> URL:
    """Return a PostgreSQL SQLAlchemy URL configured for the asyncpg driver."""
    normalized = database_url.strip()
    if normalized.startswith("postgres://"):
        normalized = "postgresql://" + normalized[len("postgres://") :]

    url = make_url(normalized)

    if url.get_backend_name() != "postgresql":
        raise ValueError(
            "DATABASE_URL must use PostgreSQL for the async application database."
        )

    if url.drivername == "postgresql+asyncpg":
        return url

    if url.drivername in {"postgresql", "postgresql+psycopg", "postgresql+psycopg2"}:
        return url.set(drivername="postgresql+asyncpg")

    raise ValueError(
        "DATABASE_URL must use a PostgreSQL driver supported by the application "
        "(postgresql, postgresql+psycopg, postgresql+psycopg2, or postgresql+asyncpg)."
    )
