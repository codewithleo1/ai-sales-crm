"""Deal model — represents a sales opportunity in the pipeline."""

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Deal(Base):
    """Maps to the deals table in Supabase."""

    __tablename__ = "deals"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    contact_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("contacts.id"), nullable=True
    )
    stage: Mapped[str | None] = mapped_column(String, nullable=True)
    value: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    probability: Mapped[int | None] = mapped_column(Integer, nullable=True)
    expected_close_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_activity_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    days_in_stage: Mapped[int] = mapped_column(Integer, default=0)
    churn_score: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=0.0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )