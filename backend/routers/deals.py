"""Deals CRUD + churn refresh, all scoped to the current user's organization."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from database import get_db
from ai import calculate_churn_score, calculate_lead_score, explain_churn

router = APIRouter(prefix="/api/deals", tags=["deals"])

STAGES = ["lead", "contacted", "proposal", "negotiation", "closed_won", "closed_lost"]


class DealCreate(BaseModel):
    title: str
    contact_id: str | None = None
    stage: str = "lead"
    value: float = 0
    probability: int = 10
    expected_close_date: str | None = None
    notes: str | None = None


class DealUpdate(BaseModel):
    title: str | None = None
    contact_id: str | None = None
    stage: str | None = None
    value: float | None = None
    probability: int | None = None
    expected_close_date: str | None = None
    notes: str | None = None


def _score(deal: dict) -> dict:
    deal["churn_score"] = calculate_churn_score(deal)
    deal["lead_score"] = calculate_lead_score(deal)
    return deal


@router.get("")
async def list_deals(user: dict = Depends(get_current_user)):
    db = get_db()
    deals = await db.deals.find({"org_id": user["org_id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"data": deals}


@router.post("", status_code=201)
async def create_deal(body: DealCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    deal = {"id": str(uuid.uuid4()), "org_id": user["org_id"], "owner_id": user["id"],
            **body.model_dump(), "days_in_stage": 0, "last_activity_date": now[:10],
            "created_at": now, "updated_at": now}
    _score(deal)
    await db.deals.insert_one(deal)
    deal.pop("_id", None)
    return {"data": deal}


@router.patch("/{deal_id}")
async def update_deal(deal_id: str, body: DealUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    deal = await db.deals.find_one({"id": deal_id, "org_id": user["org_id"]}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    updates = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if "stage" in updates and updates["stage"] != deal.get("stage"):
        updates["days_in_stage"] = 0
    updates["last_activity_date"] = datetime.now(timezone.utc).isoformat()[:10]
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    deal.update(updates)
    _score(deal)
    await db.deals.update_one({"id": deal_id}, {"$set": {**updates,
                              "churn_score": deal["churn_score"], "lead_score": deal["lead_score"]}})
    return {"data": deal}


@router.delete("/{deal_id}")
async def delete_deal(deal_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    res = await db.deals.delete_one({"id": deal_id, "org_id": user["org_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Deal not found")
    return {"data": {"deleted": deal_id}}


@router.get("/at-risk")
async def at_risk(user: dict = Depends(get_current_user)):
    db = get_db()
    deals = await db.deals.find(
        {"org_id": user["org_id"], "churn_score": {"$gte": 0.7}}, {"_id": 0}
    ).sort("churn_score", -1).to_list(100)
    return {"data": deals}


@router.post("/{deal_id}/explain")
async def explain(deal_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    deal = await db.deals.find_one({"id": deal_id, "org_id": user["org_id"]}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    text = await explain_churn(deal, deal.get("churn_score", 0))
    return {"data": {"explanation": text}}


@router.post("/refresh-scores")
async def refresh_scores(user: dict = Depends(get_current_user)):
    db = get_db()
    deals = await db.deals.find({"org_id": user["org_id"]}, {"_id": 0}).to_list(1000)
    for d in deals:
        _score(d)
        await db.deals.update_one({"id": d["id"]},
                                  {"$set": {"churn_score": d["churn_score"], "lead_score": d["lead_score"]}})
    return {"data": {"updated": len(deals)}}
