"""
Activities router — log emails, calls, meetings against deals/contacts.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.activity import Activity
from app.schemas.insight import APIResponse

router = APIRouter(prefix="/api/activities", tags=["activities"])


@router.get("", response_model=APIResponse)
async def list_activities(db: AsyncSession = Depends(get_db)) -> APIResponse:
    """Return all activities ordered by most recent."""
    result = await db.execute(
        select(Activity).order_by(Activity.occurred_at.desc())
    )
    activities = result.scalars().all()
    return APIResponse(data=[
        {
            "id": a.id,
            "deal_id": a.deal_id,
            "contact_id": a.contact_id,
            "type": a.type,
            "description": a.description,
            "occurred_at": a.occurred_at.isoformat() if a.occurred_at else None,
        }
        for a in activities
    ])


@router.post("", response_model=APIResponse, status_code=201)
async def create_activity(
    payload: dict, db: AsyncSession = Depends(get_db)
) -> APIResponse:
    """Log a new activity."""
    activity = Activity(**payload)
    db.add(activity)
    await db.flush()
    await db.refresh(activity)
    return APIResponse(data={"id": activity.id, "type": activity.type})


@router.delete("/{activity_id}", response_model=APIResponse)
async def delete_activity(
    activity_id: str, db: AsyncSession = Depends(get_db)
) -> APIResponse:
    """Delete an activity log entry."""
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    await db.delete(activity)
    return APIResponse(data={"deleted": activity_id})