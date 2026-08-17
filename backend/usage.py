"""AI credit quota enforcement per organization plan."""
from fastapi import HTTPException

# Plan -> monthly AI credit cap (mirrors billing.PLANS ai_credits)
LIMITS = {"free": 50, "pro": 1000, "enterprise": 50000}


def plan_limit(plan: str) -> int:
    return LIMITS.get(plan, LIMITS["free"])


async def enforce_ai_quota(db, org_id: str) -> dict:
    """Raise 402 if the org has hit its AI credit cap. Returns usage info."""
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    limit = plan_limit(org.get("plan", "free"))
    used = org.get("ai_credits_used", 0)
    if used >= limit:
        raise HTTPException(
            status_code=402,
            detail=f"You've used all {limit} AI credits on the {org.get('plan','free').title()} plan. "
                   "Upgrade to keep using AI features.",
        )
    return {"used": used, "limit": limit, "remaining": limit - used,
            "low": used >= limit * 0.8}
