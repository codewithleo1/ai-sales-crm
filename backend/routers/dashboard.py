"""Dashboard stats and AI insight/email endpoints."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from database import get_db
import ai

router = APIRouter(prefix="/api", tags=["ai"])


@router.get("/dashboard/stats")
async def stats(user: dict = Depends(get_current_user)):
    db = get_db()
    deals = await db.deals.find({"org_id": user["org_id"]}, {"_id": 0}).to_list(2000)
    contacts_count = await db.contacts.count_documents({"org_id": user["org_id"]})
    total_pipeline = sum(float(d.get("value") or 0) for d in deals
                         if d.get("stage") not in ("closed_won", "closed_lost"))
    won = [d for d in deals if d.get("stage") == "closed_won"]
    closed = [d for d in deals if d.get("stage") in ("closed_won", "closed_lost")]
    win_rate = round(len(won) / len(closed) * 100) if closed else 0
    at_risk = [d for d in deals if d.get("churn_score", 0) >= 0.7
               and d.get("stage") not in ("closed_won", "closed_lost")]
    arr = sum(float(d.get("value") or 0) for d in won)
    active = [d for d in deals if d.get("stage") not in ("closed_won", "closed_lost")]
    avg_deal = round(total_pipeline / len(active)) if active else 0
    stage_counts = {}
    stage_values = {}
    for d in deals:
        s = d.get("stage")
        stage_counts[s] = stage_counts.get(s, 0) + 1
        stage_values[s] = stage_values.get(s, 0) + float(d.get("value") or 0)
    return {"data": {
        "total_pipeline": total_pipeline, "arr": arr, "win_rate": win_rate,
        "avg_deal_value": avg_deal, "at_risk_count": len(at_risk),
        "active_deals": len(active), "total_deals": len(deals),
        "won_count": len(won), "contacts_count": contacts_count,
        "stage_counts": stage_counts, "stage_values": stage_values,
    }}


class DraftBody(BaseModel):
    deal_id: str
    tone: str = "professional"


class SendBody(BaseModel):
    deal_id: str
    to_email: str
    subject: str
    body: str


@router.post("/ai/email/draft")
async def draft(body: DraftBody, user: dict = Depends(get_current_user)):
    db = get_db()
    deal = await db.deals.find_one({"id": body.deal_id, "org_id": user["org_id"]}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    contact = await db.contacts.find_one({"id": deal.get("contact_id")}, {"_id": 0}) or \
        {"name": "there", "title": "", "company": ""}
    result = await ai.draft_email(deal, contact, body.tone)
    await db.organizations.update_one({"id": user["org_id"]}, {"$inc": {"ai_credits_used": 1}})
    return {"data": {**result, "to_email": contact.get("email")}}


@router.post("/ai/email/send")
async def send(body: SendBody, user: dict = Depends(get_current_user)):
    """Sends via Resend if configured; otherwise records the send (demo mode)."""
    import os
    db = get_db()
    deal = await db.deals.find_one({"id": body.deal_id, "org_id": user["org_id"]}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    key = os.environ.get("RESEND_API_KEY", "")
    sent = False
    error = None
    if key:
        try:
            import resend
            resend.api_key = key
            resend.Emails.send({"from": "onboarding@resend.dev", "to": body.to_email,
                                "subject": body.subject, "html": body.body.replace("\n", "<br>")})
            sent = True
        except Exception as e:
            error = str(e)
    return {"data": {"sent": sent, "error": error, "to": body.to_email}}


@router.get("/ai/insights")
async def get_insights(user: dict = Depends(get_current_user)):
    db = get_db()
    docs = await db.insights.find({"org_id": user["org_id"]}, {"_id": 0}).sort("generated_at", -1).to_list(10)
    return {"data": docs}


@router.post("/ai/insights/generate")
async def gen_insights(user: dict = Depends(get_current_user)):
    db = get_db()
    deals = await db.deals.find({"org_id": user["org_id"]}, {"_id": 0}).to_list(2000)
    content = await ai.generate_insights(deals)
    doc = {"id": str(uuid.uuid4()), "org_id": user["org_id"], "type": "pipeline",
           "content": content, "generated_at": datetime.now(timezone.utc).isoformat(), "dismissed": False}
    await db.insights.insert_one(doc)
    await db.organizations.update_one({"id": user["org_id"]}, {"$inc": {"ai_credits_used": 1}})
    doc.pop("_id", None)
    return {"data": doc}
