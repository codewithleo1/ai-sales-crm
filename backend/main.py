"""
Main entry point for the AI Sales CRM FastAPI backend.
Wires together all routers, middleware, and startup logic.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import activities, contacts, deals, emails, insights, predictions


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs on startup and shutdown."""
    print(f"🚀 AI Sales CRM starting in {settings.environment} mode")
    yield
    print("👋 AI Sales CRM shutting down")


app = FastAPI(
    title="AI Sales CRM",
    description="AI-powered CRM with churn prediction and email drafting",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allows the React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(contacts.router)
app.include_router(deals.router)
app.include_router(activities.router)
app.include_router(predictions.router)
app.include_router(emails.router)
app.include_router(insights.router)


@app.get("/api/health")
async def health_check() -> dict:
    """
    Health check endpoint.
    Used by Render to verify the server is alive.
    Frontend pings this on load to wake Render from sleep.
    """
    return {"status": "ok", "environment": settings.environment}