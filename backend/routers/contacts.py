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
async def list_contacts(
    user: dict = Depends(get_current_user),
    q: str = "", page: int = 1, page_size: int = 24,
):
    db = get_db()
    query = {"org_id": user["org_id"]}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
            {"company": {"$regex": q, "$options": "i"}},
        ]
    total = await db.contacts.count_documents(query)
    page = max(1, page)
    page_size = min(max(1, page_size), 2000)
    cursor = db.contacts.find(query, {"_id": 0}).sort("created_at", -1) \
        .skip((page - 1) * page_size).limit(page_size)
    contacts = await cursor.to_list(page_size)
    return {"data": contacts, "total": total, "page": page, "page_size": page_size,
            "pages": max(1, (total + page_size - 1) // page_size)}


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
