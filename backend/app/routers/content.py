"""
routers/content.py
Content Service API — 9 endpoints covering post CRUD,
draft retrieval, and media metadata management.

PostgreSQL (SQLAlchemy) ←→ structured post metadata
MongoDB (Motor async)   ←→ rich content documents & media library
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.queue import Queue
from app.schemas.content import (
    MediaMetaCreate,
    MediaMetaOut,
    PostCreate,
    PostOut,
    PostUpdate,
    PublishLogOut,
)
from app.services import content_service, mongo_content_service

router = APIRouter(prefix="/api/v1/content", tags=["Content"])


# ─────────────────────────────────────────────────────────────────────────────
# POST  /posts  — create a new post
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/posts", response_model=PostOut, status_code=status.HTTP_201_CREATED)
async def create_post(
    data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a post row in PostgreSQL, then automatically save a content
    draft document to MongoDB keyed by the new post_id.
    """
    # 1. Persist structured metadata to PostgreSQL
    new_post = content_service.create_post(db, user_id=current_user.id, data=data)

    # 2. Auto-save rich content draft to MongoDB (best-effort — non-fatal if MongoDB unavailable)
    try:
        await mongo_content_service.save_draft(
            post_id=new_post.id,
            user_id=current_user.id,
            raw_content=data.content,
            content_type=data.content_type,
            platform=data.platform,
            media_refs=data.media_urls or [],
        )
    except Exception as mongo_err:
        import logging
        logging.getLogger(__name__).warning(
            "MongoDB draft save skipped (post %s still created in PostgreSQL): %s",
            new_post.id, mongo_err,
        )

    return new_post


# ─────────────────────────────────────────────────────────────────────────────
# GET  /posts  — list posts (with optional filters)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/posts", response_model=List[PostOut])
def list_posts(
    post_status: Optional[str] = Query(None, alias="status", description="Filter by post status"),
    platform: Optional[str] = Query(None, description="Filter by platform"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all posts for the authenticated user.
    Supports optional ?status= and ?platform= query filters,
    plus ?skip= / ?limit= for pagination.
    """
    return content_service.list_posts(
        db,
        user_id=current_user.id,
        post_status=post_status,
        platform=platform,
        skip=skip,
        limit=limit,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET  /posts/{post_id}  — get a single post
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/posts/{post_id}", response_model=PostOut)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a single post by ID (ownership enforced)."""
    return content_service.get_post_or_404(db, post_id=post_id, user_id=current_user.id)


# ─────────────────────────────────────────────────────────────────────────────
# PATCH  /posts/{post_id}  — partial update
# ─────────────────────────────────────────────────────────────────────────────
@router.patch("/posts/{post_id}", response_model=PostOut)
async def update_post(
    post_id: int,
    data: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Partially update a post.  Any field left out of the request body
    remains unchanged.  If content or media_urls are updated the
    MongoDB draft is synced automatically.
    """
    updated_post = content_service.update_post(
        db, post_id=post_id, user_id=current_user.id, data=data
    )

    # Sync draft if content-related fields changed
    content_fields = {"content", "media_urls", "content_type", "platform"}
    if data.model_fields_set & content_fields:
        await mongo_content_service.save_draft(
            post_id=updated_post.id,
            user_id=current_user.id,
            raw_content=updated_post.content,
            content_type=updated_post.content_type,
            platform=updated_post.platform,
            media_refs=updated_post.media_urls or [],
        )

    return updated_post


# ─────────────────────────────────────────────────────────────────────────────
# DELETE  /posts/{post_id}  — delete post + its draft
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Hard-delete the post row from PostgreSQL and remove the associated
    MongoDB draft document (if one exists).
    """
    content_service.delete_post(db, post_id=post_id, user_id=current_user.id)
    try:
        await mongo_content_service.delete_draft(post_id)
    except Exception as mongo_err:
        import logging
        logging.getLogger(__name__).warning("MongoDB draft delete skipped: %s", mongo_err)


# ─────────────────────────────────────────────────────────────────────────────
# GET  /drafts  — list all MongoDB drafts for the current user
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/drafts", response_model=List[Dict[str, Any]])
async def list_drafts(
    current_user: User = Depends(get_current_user),
):
    """
    Return all content draft documents from MongoDB for the current user,
    ordered newest-first.  Each document contains the full rich content
    body, media references, hashtags, and mentions.
    """
    return await mongo_content_service.list_drafts(user_id=current_user.id)


# ─────────────────────────────────────────────────────────────────────────────
# GET  /drafts/{post_id}  — get draft for a specific post
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/drafts/{post_id}", response_model=Dict[str, Any])
async def get_draft(
    post_id: int,
    current_user: User = Depends(get_current_user),
):
    """
    Fetch the MongoDB draft document for a given post_id.
    Returns 404 if no draft exists.
    """
    draft = await mongo_content_service.get_draft(post_id=post_id)
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No draft found for post {post_id}",
        )
    # Ownership check
    if draft.get("user_id") != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this draft",
        )
    return draft


# ─────────────────────────────────────────────────────────────────────────────
# POST  /media  — store media metadata
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/media", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def add_media_metadata(
    data: MediaMetaCreate,
    current_user: User = Depends(get_current_user),
):
    """
    Save media asset metadata (filename, URL, type, size) to MongoDB.
    Actual file upload / cloud storage is handled externally and the URL
    is provided by the client.
    """
    return await mongo_content_service.save_media_meta(
        user_id=current_user.id,
        data=data,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET  /media  — list user's media library
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/media", response_model=List[Dict[str, Any]])
async def list_media(
    current_user: User = Depends(get_current_user),
):
    """
    Return all media metadata documents for the current user from MongoDB,
    ordered by upload date (newest first).
    """
    return await mongo_content_service.list_media(user_id=current_user.id)

# ─────────────────────────────────────────────────────────────────────────────
# GET  /logs  — list publishing logs
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/logs", response_model=List[PublishLogOut])
def list_publishing_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    skip: int = 0
):
    """
    Return all publishing activity logs for the current user's posts.
    """
    from app.models.post import Post
    posts = (
        db.query(Post)
        .filter(Post.user_id == current_user.id)
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    logs = []
    for p in posts:
        logs.append(
            PublishLogOut(
                id=p.id,
                post_id=p.id,
                social_account_id=p.social_account_id,
                platform=p.platform,
                queue_type="immediate" if p.status == "published" else "scheduled",
                content=p.content or "",
                media_url=p.media_urls[0] if p.media_urls else None,
                scheduled_time=p.scheduled_time or p.created_at,
                last_attempt_at=p.published_at or p.updated_at,
                status=p.status,
                retry_count=0,
                error_message=None,
                platform_response=None,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
        )

    return logs
