"""
Agentic AI system with human-in-the-loop boundary rules.

Decision boundary:
  - stage in [lead, contacted] AND value < 50000  → agent acts autonomously
  - stage == proposal  OR  value >= 50000         → agent prepares, human approves
  - stage in [negotiation, closed_won, closed_lost] → agent observes only
"""
import uuid
from datetime import datetime, timezone

from database import get_db
from ai import explain_churn, draft_email
from email_service import send_email

AUTONOMOUS_STAGES = {"lead", "contacted"}
APPROVAL_STAGES = {"proposal"}
OBSERVE_STAGES = {"negotiation", "closed_won", "closed_lost"}
AUTONOMOUS_VALUE_LIMIT = 50_000


def _boundary(deal: dict) -> str:
    """Return 'autonomous' | 'approval' | 'observe'."""
    stage = deal.get("stage", "")
    value = float(deal.get("value") or 0)
    if stage in OBSERVE_STAGES:
        return "observe"
    if stage in APPROVAL_STAGES or value >= AUTONOMOUS_VALUE_LIMIT:
        return "approval"
    return "autonomous"


async def run_agent(org_id: str, triggered_by: str = "manual") -> dict:
    """
    Scan all at-risk deals for an org, decide action boundary, and act.
    Returns a summary of what the agent did this run.
    """
    db = get_db()

    # Fetch at-risk deals (churn_score >= 0.7, not closed)
    deals = await db.deals.find(
        {
            "org_id": org_id,
            "churn_score": {"$gte": 0.7},
            "stage": {"$nin": ["closed_won", "closed_lost"]},
        },
        {"_id": 0},
    ).sort("churn_score", -1).to_list(50)

    autonomous_count = 0
    pending_count = 0
    observed_count = 0

    for deal in deals:
        boundary = _boundary(deal)

        # Fetch linked contact (for email drafting)
        contact = {}
        if deal.get("contact_id"):
            contact = await db.contacts.find_one(
                {"id": deal["contact_id"], "org_id": org_id}, {"_id": 0}
            ) or {}

        explanation = await explain_churn(deal, deal.get("churn_score", 0))
        draft = await draft_email(deal, contact, tone="professional")

        action = {
            "id": str(uuid.uuid4()),
            "org_id": org_id,
            "deal_id": deal["id"],
            "deal_title": deal.get("title"),
            "deal_value": deal.get("value"),
            "deal_stage": deal.get("stage"),
            "churn_score": deal.get("churn_score"),
            "boundary": boundary,
            "explanation": explanation,
            "draft_subject": draft.get("subject"),
            "draft_body": draft.get("body"),
            "to_email": contact.get("email", ""),
            "contact_name": contact.get("name", ""),
            "triggered_by": triggered_by,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        if boundary == "autonomous":
            # Act immediately — send email + log
            sent, err = await send_email(
                to=contact.get("email", ""),
                subject=draft.get("subject", ""),
                body_text=draft.get("body", ""),
            )
            action["status"] = "sent" if sent else "sent_demo"
            action["send_error"] = err
            autonomous_count += 1

            # Log activity on the deal
            await db.activities.insert_one({
                "id": str(uuid.uuid4()),
                "org_id": org_id,
                "deal_id": deal["id"],
                "type": "agent_email",
                "description": f"Agent auto-sent follow-up: {draft.get('subject')}",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "_id_excluded": True,
            })

        elif boundary == "approval":
            action["status"] = "pending"
            pending_count += 1

        else:  # observe
            action["status"] = "observed"
            observed_count += 1

        # Persist action log
        await db.agent_actions.insert_one(action)

    return {
        "deals_scanned": len(deals),
        "autonomous": autonomous_count,
        "pending_approval": pending_count,
        "observed": observed_count,
        "triggered_by": triggered_by,
        "ran_at": datetime.now(timezone.utc).isoformat(),
    }