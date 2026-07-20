"""Pydantic schemas for Contact request and response shapes."""

from datetime import datetime

from pydantic import BaseModel, EmailStr


class ContactCreate(BaseModel):
    """Shape of data required to create a new contact."""

    name: str
    email: EmailStr
    company: str | None = None
    title: str | None = None
    phone: str | None = None


class ContactResponse(BaseModel):
    """Shape of data returned when reading a contact."""

    id: str
    name: str
    email: str
    company: str | None
    title: str | None
    phone: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ContactUpdate(BaseModel):
    """All fields optional — only send what you want to change."""

    name: str | None = None
    email: EmailStr | None = None
    company: str | None = None
    title: str | None = None
    phone: str | None = None