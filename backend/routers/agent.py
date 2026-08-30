"""Agent Inbox router — run agent, view inbox, approve/reject actions."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from database import get_db
from agent import run_agent
from email_service import send_email

router = APIRouter(prefix="/api/agent", tags=["agent"])


@router.post("/run")
async def trigger_agent(user: dict = Depends(get_current_user)):
    """Manually trigger the agent to scan the pipeline."""
    summary = await run_agent(org_id=user["org_id"], triggered_by=user["id"])
    return {"data": summary}


@router.get("/inbox")
async def get_inbox(user: dict = Depends(get_current_user)):
    """
    Returns:
    - pending: actions awaiting human approval
    - recent:  last 20 autonomous/observed actions
    """
    db = get_db()

    pending = await db.agent_actions.find(
        {"org_id": user["org_id"], "status": "pending"},
        {"_id": 0},
    ).sort("created_at", -1).to_list(50)

    recent = await db.agent_actions.find(
        {"org_id": user["org_id"], "status": {"$in": ["sent", "sent_demo", "observed", "approved", "rejected"]}},
        {"_id": 0},
    ).sort("created_at", -1).to_list(20)

    return {"data": {"pending": pending, "recent": recent}}


@router.post("/approve/{action_id}")
async def approve_action(action_id: str, user: dict = Depends(get_current_user)):
    """Human approves a pending action — agent sends the email."""
    db = get_db()
    action = await db.agent_actions.find_one(
        {"id": action_id, "org_id": user["org_id"]}, {"_id": 0}
    )
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    if action["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Action is already '{action['status']}'")

    sent, err = await send_email(
        to=action.get("to_email", ""),
        subject=action.get("draft_subject", ""),
        body_text=action.get("draft_body", ""),
    )

    new_status = "approved" if sent else "approved_demo"
    await db.agent_actions.update_one(
        {"id": action_id},
        {"$set": {
            "status": new_status,
            "send_error": err,
            "approved_by": user["id"],
            "actioned_at": datetime.now(timezone.utc).isoformat(),
        }},
    )

    # Log activity on the deal
    await db.activities.insert_one({
        "id": action_id + "_act",
        "org_id": user["org_id"],
        "deal_id": action.get("deal_id"),
        "type": "agent_email_approved",
        "description": f"Agent email approved & sent by {user.get('name', 'user')}: {action.get('draft_subject')}",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"data": {"status": new_status, "sent": sent, "error": err}}


@router.post("/reject/{action_id}")
async def reject_action(action_id: str, user: dict = Depends(get_current_user)):
    """Human rejects a pending action — email is discarded."""
    db = get_db()
    action = await db.agent_actions.find_one(
        {"id": action_id, "org_id": user["org_id"]}, {"_id": 0}
    )
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    if action["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Action is already '{action['status']}'")

    await db.agent_actions.update_one(
        {"id": action_id},
        {"$set": {
            "status": "rejected",
            "rejected_by": user["id"],
            "actioned_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"data": {"status": "rejected"}}