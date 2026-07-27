from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field


# ─────────────────────────────────────────────
# Post schemas (PostgreSQL)
# ─────────────────────────────────────────────

class PostCreate(BaseModel):
    social_account_id: int = 0             # 0 = no specific account (uses platform routing)
    platform: str                           # facebook | instagram | linkedin | twitter | youtube | pinterest
    content_type: str = "text"              # text | image | video | carousel | story | reel
    content: Optional[str] = None
    media_urls: Optional[List[str]] = []
    scheduled_time: Optional[datetime] = None
    status: str = "draft"

    def __init__(self, **data):
        # Normalise status to lowercase
        if "status" in data and data["status"]:
            data["status"] = data["status"].lower()
        # Normalise content_type to lowercase
        if "content_type" in data and data["content_type"]:
            data["content_type"] = data["content_type"].lower()
        super().__init__(**data)


class PostUpdate(BaseModel):
    content: Optional[str] = None
    media_urls: Optional[List[str]] = None
    content_type: Optional[str] = None
    platform: Optional[str] = None
    status: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    published_at: Optional[datetime] = None


class PostOut(BaseModel):
    id: int
    user_id: int
    social_account_id: Optional[int]        # nullable — post may not have a linked account yet
    platform: str
    content_type: str
    content: Optional[str]
    media_urls: Optional[List[str]]
    status: str
    scheduled_time: Optional[datetime]
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Draft schemas (MongoDB)
# ─────────────────────────────────────────────

class ContentDraftOut(BaseModel):
    """
    Represents a content_drafts MongoDB document returned to the client.
    _id is serialised as a string 'id'.
    """
    id: str = Field(..., alias="_id")
    post_id: int
    user_id: int
    raw_content: Optional[str]
    content_type: str
    platform: str
    media_refs: List[str]
    hashtags: List[str]
    mentions: List[str]
    extra_metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


# ─────────────────────────────────────────────
# Media metadata schemas (MongoDB)
# ─────────────────────────────────────────────

class MediaMetaCreate(BaseModel):
    filename: str
    url: str
    content_type: str       # e.g. "image/jpeg", "video/mp4"
    size_bytes: Optional[int] = None
    caption: Optional[str] = None
    alt_text: Optional[str] = None


class MediaMetaOut(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: int
    filename: str
    url: str
    content_type: str
    size_bytes: Optional[int]
    caption: Optional[str]
    alt_text: Optional[str]
    uploaded_at: datetime

    class Config:
        populate_by_name = True

class PublishLogOut(BaseModel):
    id: int
    post_id: Optional[int] = None
    scheduled_post_id: Optional[int] = None
    social_account_id: Optional[int] = None
    platform: str
    queue_type: Optional[str] = "immediate"
    content: Optional[str] = ""
    media_url: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    last_attempt_at: Optional[datetime] = None
    status: str
    retry_count: Optional[int] = 0
    error_message: Optional[str] = None
    platform_response: Optional[Any] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
