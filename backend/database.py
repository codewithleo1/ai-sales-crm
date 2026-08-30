"""MongoDB connection and shared helpers."""
import os
from motor.motor_asyncio import AsyncIOMotorClient

_client: AsyncIOMotorClient | None = None
_db = None


def get_db():
    global _client, _db
    if _db is None:
        _client = AsyncIOMotorClient(os.environ["MONGO_URL"])
        _db = _client[os.environ["DB_NAME"]]
    return _db


async def create_indexes():
    db = get_db()
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.organizations.create_index("id", unique=True)
    await db.contacts.create_index([("org_id", 1)])
    await db.deals.create_index([("org_id", 1)])
    await db.activities.create_index([("org_id", 1)])
    await db.insights.create_index([("org_id", 1)])
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")
    await db.agent_actions.create_index([("org_id", 1), ("status", 1)])
    await db.agent_actions.create_index("id", unique=True)