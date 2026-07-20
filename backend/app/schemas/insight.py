"""Pydantic schemas for AI Insight response shapes."""

from datetime import datetime

from pydantic import BaseModel


class InsightResponse(BaseModel):
    """Shape of data returned when reading an AI insight."""

    id: str
    deal_id: str | None
    type: str | None
    content: str | None
    generated_at: datetime
    dismissed: bool

    model_config = {"from_attributes": True}


class APIResponse(BaseModel):
    """Standard envelope for all API responses."""

    data: object = None
    error: str | None = None
    meta: dict = {}