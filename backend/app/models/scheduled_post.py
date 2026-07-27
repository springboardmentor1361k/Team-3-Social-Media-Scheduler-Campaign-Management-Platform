from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class ScheduledPost(Base):
    __tablename__ = "scheduled_posts"

    id = Column(Integer, primary_key=True, index=True)

    post_id = Column(
        Integer,
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    scheduled_time = Column(DateTime(timezone=True), nullable=False, index=True)

    is_recurring = Column(Boolean, nullable=False, default=False)
    # e.g. "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR"
    recurrence_rule = Column(String(100), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True)

    # Celery task ID for cancellation / inspection
    celery_task_id = Column(String(255), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    post = relationship("Post", back_populates="scheduled_post")
