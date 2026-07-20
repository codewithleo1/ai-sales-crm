"""Pydantic schemas for Deal request and response shapes."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class DealCreate(BaseModel):
    """Shape of data required to create a new deal."""

    title: str
    contact_id: str | None = None
    stage: str | None = "prospecting"
    value: Decimal | None = None
    probability: int | None = Field(default=None, ge=0, le=100)
    expected_close_date: date | None = None
    notes: str | None = None


class DealResponse(BaseModel):
    """Shape of data returned when reading a deal."""

    id: str
    title: str
    contact_id: str | None
    stage: str | None
    value: Decimal | None
    probability: int | None
    expected_close_date: date | None
    last_activity_date: date | None
    days_in_stage: int
    churn_score: Decimal
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DealUpdate(BaseModel):
    """All fields optional — only send what you want to change."""

    title: str | None = None
    contact_id: str | None = None
    stage: str | None = None
    value: Decimal | None = None
    probability: int | None = Field(default=None, ge=0, le=100)
    expected_close_date: date | None = None
    last_activity_date: date | None = None
    days_in_stage: int | None = None
    notes: str | None = None