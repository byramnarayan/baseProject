## database.py imports (async)
# aiosqlite: provide async driver for the sqllite then SQLAlchemy can use this driver async operation for postgress we use psycopg
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
# from sqlalchemy import create_engine
# from sqlalchemy.orm import DeclarativeBase, sessionmaker

notes="""
[ Fresh HTTP Client Request ]
               │
               ▼
┌───────────────────────────────┐
│     FastAPI intercepts URL    │
└──────────────┬────────────────┘
               │  Sees: db: Session = Depends(get_db)
               ▼
┌───────────────────────────────┐
│       Executes get_db()       │ ──► Opens db = SessionLocal()
└──────────────┬────────────────┘
               │  Yields connection
               ▼
┌───────────────────────────────┐
│   Runs your API Route Logic   │ ──► Executes queries, writes data
└──────────────┬────────────────┘
               │  Finished processing
               ▼
┌───────────────────────────────┐
│    Sends Response to Client   │
└──────────────┬────────────────┘
               │  Teardown lifecycle hook
               ▼
┌───────────────────────────────┐
│  Executes 'finally' blocks    │ ──► Triggers db.close() safely
└───────────────────────────────┘

"""


# ========================================================
# ARCHITECTURE ARCHETYPE FOR BEGINNERS:
# 1. Database Library: SQLAlchemy acts as our Python Object-Relational Mapper (ORM).
# 2. Portability: If migrating to PostgreSQL or MySQL later, only the connection URL changes.
# 3. The 3-Layer Design Pattern:
#    - Database Model: Dictates exactly how tables are structured and stored.
#    - Pydantic Schema: Dictates data contracts (what we accept vs. what we return).
#    - API Routes: The endpoint controllers handling network requests and core logic.
# ========================================================
 # Synchronous vs. Asynchronous programming in FastAPI.
# ========================================================
# 
# 1 point
# When to use which: Concurrent load Use async def for I/O-bound tasks (waiting on database queries, external APIs, or file reads)
# . Use standard def for CPU-bound tasks (heavy calculations, image processing) or when using synchronous libraries
# .Database query
# network respone External API
# file operation waiting for the disk 
# all this required waiting not computing and CPU bound computation
# 
# 2 point 
# in fastapi when define def it run that function different thred loop this is automatics 
# 
# async def FastAPI run direclty in main event loop
# this main must await for any IO operaetions 
# if do blocking OP with put await that will be worst 
# 
# The Golden Rule: Never run blocking synchronous code (like the requests library) inside an async def route, as it will block the entire main event loop
# . Use async alternatives like httpx instead
# .


# Tells SQLAlchemy exactly where to find or create the database file
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./blog.db"

# Create the core engine manager
engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    # check_same_thread=False is strictly required ONLY for SQLite.
    # It allows multiple background asynchronous threads to access the database safely.
    connect_args={"check_same_thread": False},
)

# Factory configuration for generating individual database transactions.
#   - autocommit=False: We explicitly choose when to save changes via db.commit().
#   - autoflush=False: Prevents early, unexpected changes from being written out.
# AsyncSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# 
#new  
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
# expire_on_commit: recommed with async it prevent issue with expired object after commit



class Base(DeclarativeBase):
    """
    The modern SQLAlchemy v2 Declarative Base.

    All database tables (Models) will inherit from this class to gain full
    type-checking support and automatic synchronization utilities.
    """
    pass


# def get_db():
#     """
#     FastAPI Database Dependency Provider.

#     Utilizes a 'yield' statement to act like a context manager. When injected
#     into an API endpoint, FastAPI handles the lifecycle automatically:
#       1. Creates a brand new database connection session.
#       2. Hands the active session ('db') over to the endpoint logic.
#       3. Pauses until the endpoint finishes sending its response.
#       4. Automatically closes the connection inside the 'finally' teardown phase.
#     """
#     with SessionLocal() as db:
#         yield db
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session