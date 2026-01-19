# app/main.py - bundles core functionality
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings

from .database import init_db

from app.api.transactions import router as transactions_router


app = FastAPI(title="Transactions API")


# Include routers
app.include_router(transactions_router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,       # domains allowed to make requests
    allow_credentials=True,
    allow_methods=["*"],         # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],         # Accept all headers
)


# Initialize the database (creates tables if not present)
init_db()
