"""AI Sales Assistant — chat + in-chat actions over the org's pipeline (Groq/Qwen)."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth import get_current_user
from database import get_db
from usage import enforce_ai_quota
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


def _find_deal(deals: list[dict], query: str):
    if not query:
        return None
    q = query.lower()
    for d in deals:
        if q in (d.get("title") or "").lower():
            return d
    # loose word overlap fallback
    words = set(q.split())
    best, best_score = None, 0
    for d in deals:
        title_words = set((d.get("title") or "").lower().split())
        score = len(words & title_words)
        if score > best_score:
            best, best_score = d, score
    return best if best_score > 0 else None


async def _execute_action(db, user, deals, action: str, params: dict) -> dict | None:
    org_id = user["org_id"]
    now = datetime.now(timezone.utc).isoformat()
    if action == "create_deal":
        title = (params.get("title") or "").strip()
        if not title:
            return None
        deal = {"id": str(uuid.uuid4()), "org_id": org_id, "owner_id": user["id"],
                "title": title, "contact_id": None,
                "stage": params.get("stage") if params.get("stage") in
                ("lead", "contacted", "proposal", "negotiation") else "lead",
                "value": float(params.get("value") or 0), "probability": 15,
                "expected_close_date": None, "notes": "Created via AI Assistant",
                "days_in_stage": 0, "last_activity_date": now[:10],
                "created_at": now, "updated_at": now}
        deal["churn_score"] = ai.calculate_churn_score(deal)
        deal["lead_score"] = ai.calculate_lead_score(deal)
        await db.deals.insert_one(deal)
        return {"type": "deal_created", "message": f"Created deal '{title}'.", "id": deal["id"]}

    if action == "log_activity":
        deal = _find_deal(deals, params.get("deal_query", ""))
        if not deal:
            return {"type": "not_found", "message": f"I couldn't find a deal matching '{params.get('deal_query')}'."}
        note = (params.get("note") or "Activity logged").strip()
        await db.activities.insert_one({
            "id": str(uuid.uuid4()), "org_id": org_id, "deal_id": deal["id"],
            "contact_id": deal.get("contact_id"), "type": "note",
            "description": note, "occurred_at": now})
        await db.deals.update_one({"id": deal["id"]},
                                  {"$set": {"last_activity_date": now[:10], "updated_at": now}})
        return {"type": "activity_logged", "message": f"Logged activity on '{deal['title']}': {note}", "id": deal["id"]}

    if action == "start_sequence":
        deal = _find_deal(deals, params.get("deal_query", ""))
        if not deal:
            return {"type": "not_found", "message": f"I couldn't find a deal matching '{params.get('deal_query')}'."}
        contact = await db.contacts.find_one({"id": deal.get("contact_id")}, {"_id": 0}) or \
            {"name": "there", "title": "", "company": "", "email": ""}
        steps = []
        for i, tpl in enumerate([{"offset_days": 0, "tone": "professional"},
                                 {"offset_days": 3, "tone": "persuasive"},
                                 {"offset_days": 7, "tone": "casual"}], start=1):
            steps.append({"step_no": i, "offset_days": tpl["offset_days"], "tone": tpl["tone"],
                          "status": "pending", "subject": None, "body": None,
                          "drafted_at": None, "scheduled_at": None})
        draft = await ai.draft_sequence_step(deal, contact, 1, steps[0]["tone"], 3)
        steps[0].update({"status": "drafted", "subject": draft.get("subject"),
                         "body": draft.get("body"), "drafted_at": now})
        seq = {"id": str(uuid.uuid4()), "org_id": org_id, "deal_id": deal["id"],
               "contact_email": contact.get("email"), "automation": False,
               "name": f"Follow-up cadence — {deal['title']}", "status": "active",
               "steps": steps, "created_at": now}
        await db.sequences.insert_one(seq)
        return {"type": "sequence_started", "message": f"Started a 3-step follow-up sequence for '{deal['title']}' and drafted the first email.", "id": seq["id"]}
    return None


@router.post("/chat")
async def chat(body: ChatBody, user: dict = Depends(get_current_user)):
    db = get_db()
    quota = await enforce_ai_quota(db, user["org_id"])
    stats, deals = await _stats_and_deals(db, user["org_id"])

    intent = await ai.classify_action(body.message)
    action_result = None
    if intent["action"] != "none":
        action_result = await _execute_action(db, user, deals, intent["action"], intent["params"])

    if action_result and action_result.get("type") not in ("not_found", None):
        answer = action_result["message"] + " Anything else?"
        await db.organizations.update_one({"id": user["org_id"]}, {"$inc": {"ai_credits_used": 1}})
    elif action_result and action_result.get("type") == "not_found":
        answer = action_result["message"]
    else:
        context = ai.build_pipeline_context(stats, deals)
        answer = await ai.assistant_answer(context, body.message, body.history)
        await db.organizations.update_one({"id": user["org_id"]}, {"$inc": {"ai_credits_used": 1}})

    return {"data": {"answer": answer, "action": action_result, "quota": quota}}


@router.get("/suggestions")
async def suggestions(user: dict = Depends(get_current_user)):
    return {"data": [
        "Which 3 deals should I focus on today?",
        "What's my biggest churn risk right now?",
        "Create a deal 'Globex Corp — Pilot' worth 40000",
        "Start a follow-up sequence for my most at-risk deal",
    ]}
