"""Subscription/billing with Razorpay (test mode) checkout for plan upgrades."""
import os

import razorpay
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

USD_TO_INR = 83  # approximate conversion for INR test checkout


def _rzp() -> razorpay.Client:
    return razorpay.Client(auth=(os.environ["RAZORPAY_KEY_ID"], os.environ["RAZORPAY_KEY_SECRET"]))


class UpgradeBody(BaseModel):
    plan: str


class OrderBody(BaseModel):
    plan: str
    annual: bool = False


class VerifyBody(BaseModel):
    plan: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


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
    """Direct plan change — used only for downgrading to the Free plan (no payment)."""
    if user.get("role") not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    if body.plan not in PLANS:
        raise HTTPException(status_code=400, detail="Unknown plan")
    if PLANS[body.plan]["price"] > 0:
        raise HTTPException(status_code=400, detail="Paid plans require checkout")
    db = get_db()
    await db.organizations.update_one({"id": user["org_id"]}, {"$set": {"plan": body.plan}})
    return {"data": {"plan": body.plan}}


@router.post("/razorpay/order")
async def create_order(body: OrderBody, user: dict = Depends(get_current_user)):
    if user.get("role") not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    plan = PLANS.get(body.plan)
    if not plan or plan["price"] <= 0:
        raise HTTPException(status_code=400, detail="Invalid paid plan")
    months = 12 if body.annual else 1
    discount = 0.8 if body.annual else 1.0
    amount_inr = round(plan["price"] * USD_TO_INR * months * discount)
    amount_paise = amount_inr * 100
    order = _rzp().order.create({
        "amount": amount_paise, "currency": "INR", "payment_capture": 1,
        "notes": {"org_id": user["org_id"], "plan": body.plan, "annual": str(body.annual)},
    })
    return {"data": {"order_id": order["id"], "amount": amount_paise, "currency": "INR",
                     "key_id": os.environ["RAZORPAY_KEY_ID"], "plan": body.plan,
                     "amount_inr": amount_inr}}


@router.post("/razorpay/verify")
async def verify_payment(body: VerifyBody, user: dict = Depends(get_current_user)):
    if body.plan not in PLANS:
        raise HTTPException(status_code=400, detail="Unknown plan")
    try:
        _rzp().utility.verify_payment_signature({
            "razorpay_order_id": body.razorpay_order_id,
            "razorpay_payment_id": body.razorpay_payment_id,
            "razorpay_signature": body.razorpay_signature,
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Payment signature verification failed")
    db = get_db()
    await db.organizations.update_one({"id": user["org_id"]}, {"$set": {"plan": body.plan}})
    await db.payments.insert_one({
        "org_id": user["org_id"], "plan": body.plan,
        "razorpay_order_id": body.razorpay_order_id,
        "razorpay_payment_id": body.razorpay_payment_id, "status": "paid",
    })
    return {"data": {"plan": body.plan, "status": "paid"}}
