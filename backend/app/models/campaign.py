from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name = Column(String(255), nullable=False)
    status = Column(String(50), default="Draft", nullable=False) # Active, Completed, Draft, Paused
    platforms = Column(String(255), nullable=True) # e.g. "Instagram, Facebook"
    budget = Column(String(50), nullable=True)
    reach = Column(String(50), nullable=True)
    engagement = Column(String(50), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    progress = Column(Integer, default=0, nullable=False)
    color = Column(String(100), default="from-violet-500 to-purple-600", nullable=False)

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

    owner = relationship("User", backref="campaigns")
