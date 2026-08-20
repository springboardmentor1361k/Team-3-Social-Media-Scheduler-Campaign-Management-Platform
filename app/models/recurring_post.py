from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class RecurringSchedule(Base):
    __tablename__ = "recurring_schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    content_type = Column(String(50), default="Text")
    platforms = Column(String, nullable=False) # Comma separated
    frequency = Column(String(50), default="Weekly")
    days_of_week = Column(String, nullable=True) # Comma separated
    time_slot = Column(String(10), nullable=True)
    end_condition = Column(String(50), default="Never")
    end_count = Column(Integer, nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    active = Column(Boolean, default=True)
    published_count = Column(Integer, default=0)
    campaign = Column(String(255), nullable=True)
    hashtags = Column(String(255), nullable=True)

    next_run_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    owner = relationship("User", backref="recurring_schedules")
