"""
Insights router — AI pipeline analysis endpoints.
GET  /api/insights          → latest saved insights
POST /api/insights/generate → trigger fresh Groq pipeline analysis
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.deal import Deal
from app.models.prediction import AIInsight
from app.schemas.insight import APIResponse, InsightResponse
from app.services.insight_service import generate_pipeline_insights

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("", response_model=APIResponse)
async def get_insights(
    db: AsyncSession = Depends(get_db),
) -> APIResponse:
    """Return the latest 10 AI insights, most recent first."""
    result = await db.execute(
        select(AIInsight)
        .where(AIInsight.dismissed == False)  # noqa: E712
        .order_by(AIInsight.generated_at.desc())
        .limit(10)
    )
    insights = result.scalars().all()
    return APIResponse(
        data=[InsightResponse.model_validate(i) for i in insights],
        meta={"total": len(insights)},
    )


@router.post("/generate", response_model=APIResponse)
async def generate_insights(
    db: AsyncSession = Depends(get_db),
) -> APIResponse:
    """
    Trigger a fresh AI analysis of the entire pipeline.
    Fetches all active deals, sends to Groq, saves result to ai_insights table.
    """
    # Fetch all active deals
    result = await db.execute(
        select(Deal).where(Deal.stage.notin_(["closed_won", "closed_lost"]))
    )
    deals = result.scalars().all()

    # Generate insights via Groq
    insight_content = await generate_pipeline_insights(deals)

    # Save to database
    insight = AIInsight(
        type="opportunity",
        content=insight_content,
    )
    db.add(insight)
    await db.flush()
    await db.refresh(insight)

    return APIResponse(
        data=InsightResponse.model_validate(insight),
        meta={"deals_analyzed": len(deals)},
    )


@router.patch("/{insight_id}/dismiss", response_model=APIResponse)
async def dismiss_insight(
    insight_id: str,
    db: AsyncSession = Depends(get_db),
) -> APIResponse:
    """Mark an insight as dismissed so it no longer appears on the dashboard."""
    result = await db.execute(
        select(AIInsight).where(AIInsight.id == insight_id)
    )
    insight = result.scalar_one_or_none()
    if not insight:
        return APIResponse(error="Insight not found")
    insight.dismissed = True
    await db.flush()
    return APIResponse(data={"dismissed": insight_id})