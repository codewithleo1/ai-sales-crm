"""Subscription/billing (plan state on organization). Payment processing is a Phase-2 stub."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/api/billing", tags=["billing"])

PLANS = {
    "free": {"name": "Free", "price": 0, "seats": 2, "ai_credits": 50, "deals": 100},
    "pro": {"name": "Pro", "price": 49, "seats": 10, "ai_credits": 1000, "deals": 5000},
    "enterprise": {"name": "Enterprise", "price": 199, "seats": 100, "ai_credits": 50000, "deals": 100000},
}


class UpgradeBody(BaseModel):
    plan: str


@router.get("/plans")
async def plans():
    return {"data": PLANS}


@router.get("/usage")
async def usage(user: dict = Depends(get_current_user)):
    db = get_db()
    org = await db.organizations.find_one({"id": user["org_id"]}, {"_id": 0})
    plan_key = org.get("plan", "free")
    limits = PLANS.get(plan_key, PLANS["free"])
    seats = await db.users.count_documents({"org_id": user["org_id"]})
    deals = await db.deals.count_documents({"org_id": user["org_id"]})
    return {"data": {
        "plan": plan_key, "limits": limits,
        "usage": {"seats": seats, "ai_credits": org.get("ai_credits_used", 0), "deals": deals},
    }}


@router.post("/upgrade")
async def upgrade(body: UpgradeBody, user: dict = Depends(get_current_user)):
    if user.get("role") not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    if body.plan not in PLANS:
        raise HTTPException(status_code=400, detail="Unknown plan")
    db = get_db()
    # NOTE: Real Stripe checkout is planned for Phase 2. This updates plan state only.
    await db.organizations.update_one({"id": user["org_id"]}, {"$set": {"plan": body.plan}})
    return {"data": {"plan": body.plan, "payment": "stub"}}
