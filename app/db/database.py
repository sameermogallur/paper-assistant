import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/aira.db")


def ensure_database_dir(url: str = DATABASE_URL) -> None:
    """Create the parent directory of a SQLite database file if it is missing.

    SQLite does not create intermediate directories, so on a fresh clone —
    where data/ is gitignored and therefore absent — the first connect fails.
    That surfaces as `alembic upgrade head` blowing up, since it is the first
    documented setup step to touch the DB. The path is derived from the URL
    rather than hardcoded, so a non-default DATABASE_URL is handled too.

    No-op for non-SQLite backends and for in-memory SQLite. Idempotent.
    """
    parsed = make_url(url)
    if not parsed.drivername.startswith("sqlite"):
        return
    if not parsed.database or parsed.database == ":memory:":
        return
    Path(parsed.database).parent.mkdir(parents=True, exist_ok=True)


ensure_database_dir(DATABASE_URL)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
