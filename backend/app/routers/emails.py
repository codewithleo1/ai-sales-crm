"""
Emails router — AI email drafting endpoints.
POST /api/emails/draft → generate a personalized follow-up email
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.contact import Contact
from app.models.deal import Deal
from app.schemas.insight import APIResponse
from app.services.email_service import draft_follow_up_email

router = APIRouter(prefix="/api/emails", tags=["emails"])


class EmailDraftRequest(BaseModel):
    """Request body for drafting a follow-up email."""

    deal_id: str
    tone: str = "professional"


@router.post("/draft", response_model=APIResponse)
async def draft_email(
    payload: EmailDraftRequest,
    db: AsyncSession = Depends(get_db),
) -> APIResponse:
    """
    Draft a personalized follow-up email for a deal.
    Fetches deal + contact from DB, then calls Groq to generate the email.
    """
    # Fetch the deal
    result = await db.execute(select(Deal).where(Deal.id == payload.deal_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # Fetch the associated contact
    contact = None
    if deal.contact_id:
        contact_result = await db.execute(
            select(Contact).where(Contact.id == deal.contact_id)
        )
        contact = contact_result.scalar_one_or_none()

    # Use a placeholder contact if none linked
    if not contact:
        contact = Contact(
            id="placeholder",
            name="Valued Customer",
            email="customer@example.com",
            company="their company",
            title="Decision Maker",
        )

    try:
        email_draft = await draft_follow_up_email(
            deal=deal,
            contact=contact,
            tone=payload.tone,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return APIResponse(
        data={
            "deal_id": deal.id,
            "deal_title": deal.title,
            "tone": payload.tone,
            "email": email_draft,
        }
    )