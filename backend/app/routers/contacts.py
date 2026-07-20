"""
Contacts router — CRUD endpoints for contacts.
All DB logic uses the async session from get_db().
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.contact import Contact
from app.schemas.contact import ContactCreate, ContactResponse, ContactUpdate
from app.schemas.insight import APIResponse

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


@router.get("", response_model=APIResponse)
async def list_contacts(db: AsyncSession = Depends(get_db)) -> APIResponse:
    """Return all contacts ordered by creation date."""
    result = await db.execute(select(Contact).order_by(Contact.created_at.desc()))
    contacts = result.scalars().all()
    return APIResponse(data=[ContactResponse.model_validate(c) for c in contacts])


@router.get("/{contact_id}", response_model=APIResponse)
async def get_contact(
    contact_id: str, db: AsyncSession = Depends(get_db)
) -> APIResponse:
    """Return a single contact by ID."""
    result = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return APIResponse(data=ContactResponse.model_validate(contact))


@router.post("", response_model=APIResponse, status_code=201)
async def create_contact(
    payload: ContactCreate, db: AsyncSession = Depends(get_db)
) -> APIResponse:
    """Create a new contact."""
    contact = Contact(**payload.model_dump())
    db.add(contact)
    await db.flush()
    await db.refresh(contact)
    return APIResponse(data=ContactResponse.model_validate(contact))


@router.patch("/{contact_id}", response_model=APIResponse)
async def update_contact(
    contact_id: str,
    payload: ContactUpdate,
    db: AsyncSession = Depends(get_db),
) -> APIResponse:
    """Update specific fields on a contact."""
    result = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    await db.flush()
    await db.refresh(contact)
    return APIResponse(data=ContactResponse.model_validate(contact))


@router.delete("/{contact_id}", response_model=APIResponse)
async def delete_contact(
    contact_id: str, db: AsyncSession = Depends(get_db)
) -> APIResponse:
    """Delete a contact by ID."""
    result = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    await db.delete(contact)
    return APIResponse(data={"deleted": contact_id})