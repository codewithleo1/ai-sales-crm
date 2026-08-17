"""AI Email Sequences — multi-step follow-up cadences for stalled deals."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from database import get_db
import ai

router = APIRouter(prefix="/api/sequences", tags=["sequences"])

DEFAULT_STEPS = [
    {"offset_days": 0, "tone": "professional"},
    {"offset_days": 3, "tone": "persuasive"},
    {"offset_days": 7, "tone": "casual"},
]


class SeqCreate(BaseModel):
    deal_id: str
    name: str | None = None


def _require_editor(user: dict):
    if user.get("role") == "viewer":
        raise HTTPException(status_code=403, detail="Viewers have read-only access")


async def _deal_and_contact(db, org_id, deal_id):
    deal = await db.deals.find_one({"id": deal_id, "org_id": org_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    contact = await db.contacts.find_one({"id": deal.get("contact_id")}, {"_id": 0}) or \
        {"name": "there", "title": "", "company": "", "email": ""}
    return deal, contact


async def _enrich(db, seq: dict) -> dict:
    deal = await db.deals.find_one({"id": seq["deal_id"]}, {"_id": 0, "title": 1, "value": 1})
    seq["deal_title"] = deal.get("title") if deal else "(deleted deal)"
    seq["deal_value"] = deal.get("value") if deal else 0
    return seq


@router.get("")
async def list_sequences(user: dict = Depends(get_current_user)):
    db = get_db()
    seqs = await db.sequences.find({"org_id": user["org_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for s in seqs:
        await _enrich(db, s)
    return {"data": seqs}


@router.post("", status_code=201)
async def create_sequence(body: SeqCreate, user: dict = Depends(get_current_user)):
    _require_editor(user)
    db = get_db()
    deal, contact = await _deal_and_contact(db, user["org_id"], body.deal_id)
    steps = []
    for i, tpl in enumerate(DEFAULT_STEPS, start=1):
        steps.append({"step_no": i, "offset_days": tpl["offset_days"], "tone": tpl["tone"],
                      "status": "pending", "subject": None, "body": None, "drafted_at": None})
    # Auto-draft the first step
    draft = await ai.draft_sequence_step(deal, contact, 1, steps[0]["tone"], len(steps))
    steps[0].update({"status": "drafted", "subject": draft.get("subject"),
                     "body": draft.get("body"), "drafted_at": datetime.now(timezone.utc).isoformat()})
    seq = {"id": str(uuid.uuid4()), "org_id": user["org_id"], "deal_id": body.deal_id,
           "contact_email": contact.get("email"),
           "name": body.name or f"Follow-up cadence — {deal.get('title')}",
           "status": "active", "steps": steps,
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.sequences.insert_one(seq)
    await db.organizations.update_one({"id": user["org_id"]}, {"$inc": {"ai_credits_used": 1}})
    seq.pop("_id", None)
    await _enrich(db, seq)
    return {"data": seq}


@router.post("/{seq_id}/steps/{step_no}/draft")
async def draft_step(seq_id: str, step_no: int, user: dict = Depends(get_current_user)):
    _require_editor(user)
    db = get_db()
    seq = await db.sequences.find_one({"id": seq_id, "org_id": user["org_id"]}, {"_id": 0})
    if not seq:
        raise HTTPException(status_code=404, detail="Sequence not found")
    deal, contact = await _deal_and_contact(db, user["org_id"], seq["deal_id"])
    step = next((s for s in seq["steps"] if s["step_no"] == step_no), None)
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    draft = await ai.draft_sequence_step(deal, contact, step_no, step["tone"], len(seq["steps"]))
    step.update({"status": "drafted", "subject": draft.get("subject"),
                 "body": draft.get("body"), "drafted_at": datetime.now(timezone.utc).isoformat()})
    await db.sequences.update_one({"id": seq_id}, {"$set": {"steps": seq["steps"]}})
    await db.organizations.update_one({"id": user["org_id"]}, {"$inc": {"ai_credits_used": 1}})
    await _enrich(db, seq)
    return {"data": seq}


@router.post("/{seq_id}/steps/{step_no}/send")
async def send_step(seq_id: str, step_no: int, user: dict = Depends(get_current_user)):
    _require_editor(user)
    db = get_db()
    seq = await db.sequences.find_one({"id": seq_id, "org_id": user["org_id"]}, {"_id": 0})
    if not seq:
        raise HTTPException(status_code=404, detail="Sequence not found")
    step = next((s for s in seq["steps"] if s["step_no"] == step_no), None)
    if not step or step["status"] == "pending":
        raise HTTPException(status_code=400, detail="Draft the step before sending")
    step["status"] = "sent"
    step["sent_at"] = datetime.now(timezone.utc).isoformat()
    if all(s["status"] == "sent" for s in seq["steps"]):
        seq["status"] = "completed"
    await db.sequences.update_one({"id": seq_id}, {"$set": {"steps": seq["steps"], "status": seq["status"]}})
    await _enrich(db, seq)
    return {"data": seq}


@router.delete("/{seq_id}")
async def delete_sequence(seq_id: str, user: dict = Depends(get_current_user)):
    _require_editor(user)
    db = get_db()
    res = await db.sequences.delete_one({"id": seq_id, "org_id": user["org_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sequence not found")
    return {"data": {"deleted": seq_id}}
