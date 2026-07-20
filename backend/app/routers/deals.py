"""
Deals router — CRUD endpoints for deals.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.deal import Deal
from app.schemas.deal import DealCreate, DealResponse, DealUpdate
from app.schemas.insight import APIResponse

router = APIRouter(prefix="/api/deals", tags=["deals"])


@router.get("", response_model=APIResponse)
async def list_deals(db: AsyncSession = Depends(get_db)) -> APIResponse:
    """Return all deals ordered by creation date."""
    result = await db.execute(select(Deal).order_by(Deal.created_at.desc()))
    deals = result.scalars().all()
    return APIResponse(data=[DealResponse.model_validate(d) for d in deals])


@router.get("/{deal_id}", response_model=APIResponse)
async def get_deal(deal_id: str, db: AsyncSession = Depends(get_db)) -> APIResponse:
    """Return a single deal by ID."""
    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return APIResponse(data=DealResponse.model_validate(deal))


@router.post("", response_model=APIResponse, status_code=201)
async def create_deal(
    payload: DealCreate, db: AsyncSession = Depends(get_db)
) -> APIResponse:
    """Create a new deal."""
    deal = Deal(**payload.model_dump())
    db.add(deal)
    await db.flush()
    await db.refresh(deal)
    return APIResponse(data=DealResponse.model_validate(deal))


@router.patch("/{deal_id}", response_model=APIResponse)
async def update_deal(
    deal_id: str,
    payload: DealUpdate,
    db: AsyncSession = Depends(get_db),
) -> APIResponse:
    """Update specific fields on a deal."""
    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(deal, field, value)
    await db.flush()
    await db.refresh(deal)
    return APIResponse(data=DealResponse.model_validate(deal))


@router.delete("/{deal_id}", response_model=APIResponse)
async def delete_deal(
    deal_id: str, db: AsyncSession = Depends(get_db)
) -> APIResponse:
    """Delete a deal by ID."""
    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    await db.delete(deal)
    return APIResponse(data={"deleted": deal_id})