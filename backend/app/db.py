from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import DB_PATH

# SQLite engine
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def init_db():
    """
    Initialize the database and create all tables.
    """
    import app.models  # import models so they get registered
    Base.metadata.create_all(bind=engine)
