from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    objective = Column(String(150), nullable=True)
    status = Column(String(50), default="Draft", nullable=False)  # Active, Completed, Draft, Paused
    platforms = Column(String(255), nullable=True)
    budget = Column(String(50), nullable=True)
    reach = Column(String(50), nullable=True)
    engagement = Column(String(50), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    progress = Column(Integer, default=0, nullable=False)
    color = Column(String(100), default="from-violet-500 to-purple-600", nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    owner = relationship("User", backref="campaigns")
    campaign_posts = relationship("CampaignPost", back_populates="campaign", cascade="all, delete-orphan")


class CampaignPost(Base):
    __tablename__ = "campaign_posts"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (UniqueConstraint("campaign_id", "post_id", name="uq_campaign_post"),)

    campaign = relationship("Campaign", back_populates="campaign_posts")
    post = relationship("Post", backref="campaign_posts")
