from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Queue(Base):
    __tablename__ = "queue"

    id = Column(Integer, primary_key=True, index=True)

    # Link to the actual content (one of these must be non-null)
    post_id = Column(
        Integer,
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    scheduled_post_id = Column(
        Integer,
        ForeignKey("scheduled_posts.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    # Which social account to publish to
    social_account_id = Column(
        Integer,
        ForeignKey("social_accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Queue metadata
    queue_type = Column(
        String(20),
        nullable=False,
        default="scheduled"  # scheduled, immediate, recurring
    )

    # Content snapshot (optional, but helps if post is deleted)
    content = Column(Text, nullable=False)
    media_url = Column(String(255), nullable=True)

    # Scheduling & execution
    scheduled_time = Column(DateTime(timezone=True), nullable=False, index=True)
    last_attempt_at = Column(DateTime(timezone=True), nullable=True)

    # Status & retry tracking
    status = Column(
        String(20),
        default="pending",
        nullable=False,
        index=True
    )  # pending, processing, published, failed, cancelled
    retry_count = Column(Integer, default=0, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)

    # Logging & errors
    error_message = Column(Text, nullable=True)
    platform_response = Column(JSON, nullable=True)  # stores API response details

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # Relationships
    post = relationship("Post", foreign_keys=[post_id])
    scheduled_post = relationship("ScheduledPost", foreign_keys=[scheduled_post_id])
    social_account = relationship("SocialAccount")

    