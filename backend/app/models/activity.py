"""Activity model — logs every interaction with a contact or deal."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Activity(Base):
    """Maps to the activities table in Supabase."""

    __tablename__ = "activities"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    deal_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("deals.id"), nullable=True
    )
    contact_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("contacts.id"), nullable=True
    )
    type: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )