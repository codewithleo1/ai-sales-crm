"""AI Sales CRM — FastAPI entrypoint (multi-tenant, JWT auth, Groq AI)."""
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_indexes
from seed import seed_demo
import auth
from routers import deals, contacts, team, dashboard, billing, assistant, sequences


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_indexes()
    await seed_demo()
    yield


app = FastAPI(title="AI Sales CRM", version="2.0.0", lifespan=lifespan)

origins = [os.environ.get("FRONTEND_URL", "http://localhost:3000")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(deals.router)
app.include_router(contacts.router)
app.include_router(team.router)
app.include_router(dashboard.router)
app.include_router(billing.router)
app.include_router(assistant.router)
app.include_router(sequences.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
