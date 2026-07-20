"""
Predictions router — churn scoring endpoints.
GET  /api/predictions/churn    → all deals sorted by churn score
POST /api/predictions/refresh  → recalculate churn scores for all deals
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.deal import Deal
from app.schemas.deal import DealResponse
from app.schemas.insight import APIResponse
from app.services.churn_service import score_and_explain

router = APIRouter(prefix="/api/predictions", tags=["predictions"])


@router.get("/churn", response_model=APIResponse)
async def get_churn_predictions(
    db: AsyncSession = Depends(get_db),
) -> APIResponse:
    """Return all deals sorted by churn score descending (highest risk first)."""
    result = await db.execute(
        select(Deal)
        .where(Deal.stage.notin_(["closed_won", "closed_lost"]))
        .order_by(Deal.churn_score.desc())
    )
    deals = result.scalars().all()
    return APIResponse(
        data=[DealResponse.model_validate(d) for d in deals],
        meta={"total": len(deals)},
    )


@router.post("/refresh", response_model=APIResponse)
async def refresh_churn_scores(
    db: AsyncSession = Depends(get_db),
) -> APIResponse:
    """
    Recalculate churn scores for all active deals.
    Calls Groq for each deal to generate a fresh explanation.
    Saves updated scores to the database.
    """
    result = await db.execute(
        select(Deal).where(Deal.stage.notin_(["closed_won", "closed_lost"]))
    )
    deals = result.scalars().all()

    updated = []
    for deal in deals:
        score, explanation = await score_and_explain(deal)
        deal.churn_score = score
        deal.notes = explanation
        updated.append({"id": deal.id, "title": deal.title, "churn_score": score})

    await db.flush()
    return APIResponse(
        data=updated,
        meta={"updated_count": len(updated)},
    )