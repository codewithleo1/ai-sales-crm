"""Contacts CRUD scoped to organization."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    company: str | None = None
    title: str | None = None
    phone: str | None = None


@router.get("")
async def list_contacts(user: dict = Depends(get_current_user)):
    db = get_db()
    contacts = await db.contacts.find({"org_id": user["org_id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"data": contacts}


@router.post("", status_code=201)
async def create_contact(body: ContactCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    contact = {"id": str(uuid.uuid4()), "org_id": user["org_id"], **body.model_dump(),
               "email": body.email.lower(), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.contacts.insert_one(contact)
    contact.pop("_id", None)
    return {"data": contact}


@router.delete("/{contact_id}")
async def delete_contact(contact_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    res = await db.contacts.delete_one({"id": contact_id, "org_id": user["org_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"data": {"deleted": contact_id}}
