"""AI Sales Assistant — chat over the org's pipeline using Groq/Qwen."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth import get_current_user
from database import get_db
import ai

router = APIRouter(prefix="/api/ai/assistant", tags=["assistant"])


class ChatBody(BaseModel):
    message: str
    history: list[dict] = []


async def _stats_and_deals(db, org_id: str):
    deals = await db.deals.find({"org_id": org_id}, {"_id": 0}).to_list(2000)
    contacts_count = await db.contacts.count_documents({"org_id": org_id})
    total_pipeline = sum(float(d.get("value") or 0) for d in deals
                         if d.get("stage") not in ("closed_won", "closed_lost"))
    won = [d for d in deals if d.get("stage") == "closed_won"]
    closed = [d for d in deals if d.get("stage") in ("closed_won", "closed_lost")]
    active = [d for d in deals if d.get("stage") not in ("closed_won", "closed_lost")]
    at_risk = [d for d in active if d.get("churn_score", 0) >= 0.7]
    stats = {
        "total_pipeline": total_pipeline,
        "arr": sum(float(d.get("value") or 0) for d in won),
        "win_rate": round(len(won) / len(closed) * 100) if closed else 0,
        "active_deals": len(active), "at_risk_count": len(at_risk),
        "contacts_count": contacts_count,
    }
    return stats, deals


@router.post("/chat")
async def chat(body: ChatBody, user: dict = Depends(get_current_user)):
    db = get_db()
    stats, deals = await _stats_and_deals(db, user["org_id"])
    context = ai.build_pipeline_context(stats, deals)
    answer = await ai.assistant_answer(context, body.message, body.history)
    await db.organizations.update_one({"id": user["org_id"]}, {"$inc": {"ai_credits_used": 1}})
    return {"data": {"answer": answer}}


@router.get("/suggestions")
async def suggestions(user: dict = Depends(get_current_user)):
    return {"data": [
        "Which 3 deals should I focus on today?",
        "What's my biggest churn risk right now?",
        "Summarize my pipeline health.",
        "Which deals are closest to closing?",
    ]}
