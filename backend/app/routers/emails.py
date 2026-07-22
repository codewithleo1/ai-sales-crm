"""
Emails router — AI email drafting and sending endpoints.
POST /api/emails/draft → generate a personalized follow-up email
POST /api/emails/send  → draft via Groq then send via Resend
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
from app.services.resend_service import send_email

router = APIRouter(prefix="/api/emails", tags=["emails"])


class EmailDraftRequest(BaseModel):
    """Request body for drafting a follow-up email."""
    deal_id: str
    tone: str = "professional"


class EmailSendRequest(BaseModel):
    """Request body for sending a real email."""
    deal_id: str
    tone: str = "professional"
    to_email: str
    to_name: str


@router.post("/draft", response_model=APIResponse)
async def draft_email(
    payload: EmailDraftRequest,
    db: AsyncSession = Depends(get_db),
) -> APIResponse:
    """Draft a personalized follow-up email for a deal."""
    result = await db.execute(select(Deal).where(Deal.id == payload.deal_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    contact = None
    if deal.contact_id:
        contact_result = await db.execute(
            select(Contact).where(Contact.id == deal.contact_id)
        )
        contact = contact_result.scalar_one_or_none()

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


@router.post("/send", response_model=APIResponse)
async def send_email_to_contact(
    payload: EmailSendRequest,
    db: AsyncSession = Depends(get_db),
) -> APIResponse:
    """Draft an email via Groq then send it via Resend."""
    result = await db.execute(select(Deal).where(Deal.id == payload.deal_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    contact = Contact(
        id="temp",
        name=payload.to_name,
        email=payload.to_email,
        company="",
        title="",
    )
    if deal.contact_id:
        contact_result = await db.execute(
            select(Contact).where(Contact.id == deal.contact_id)
        )
        db_contact = contact_result.scalar_one_or_none()
        if db_contact:
            contact = db_contact

    try:
        email_draft = await draft_follow_up_email(
            deal=deal,
            contact=contact,
            tone=payload.tone,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        send_result = await send_email(
            to_email=payload.to_email,
            to_name=payload.to_name,
            subject=f"Following up on {deal.title}",
            body=email_draft,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return APIResponse(
        data={
            "deal_id": deal.id,
            "sent_to": payload.to_email,
            "email_id": send_result.get("id"),
            "status": "sent",
            "draft": email_draft,
        }
    )