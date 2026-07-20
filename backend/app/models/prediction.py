"""AI Insight model — stores AI-generated recommendations per deal."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AIInsight(Base):
    """Maps to the ai_insights table in Supabase."""

    __tablename__ = "ai_insights"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    deal_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("deals.id"), nullable=True
    )
    type: Mapped[str | None] = mapped_column(String, nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    dismissed: Mapped[bool] = mapped_column(Boolean, default=False)