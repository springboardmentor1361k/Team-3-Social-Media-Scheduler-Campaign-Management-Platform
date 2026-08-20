"""
content_service.py
PostgreSQL (SQLAlchemy) operations for the Post entity.
"""
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.post import Post
from app.models.social_account import SocialAccount
from app.schemas.content import PostCreate, PostUpdate


def create_post(db: Session, user_id: int, data: PostCreate) -> Post:
    """
    Persist a new post row in PostgreSQL.
    Auto-resolves social_account_id from the user's connected accounts
    for the given platform if not explicitly provided.
    Returns the created Post ORM object.
    """
    social_account_id = data.social_account_id if data.social_account_id else None

    # Auto-resolve: find the user's connected account for this platform
    if not social_account_id:
        account = (
            db.query(SocialAccount)
            .filter(
                SocialAccount.user_id == user_id,
                SocialAccount.platform == data.platform,
            )
            .first()
        )
        if account:
            social_account_id = account.id

    new_post = Post(
        user_id=user_id,
        social_account_id=social_account_id,   # may be None if no account connected yet
        platform=data.platform,
        content_type=data.content_type,
        content=data.content,
        media_urls=data.media_urls or [],
        status=data.status,
        scheduled_time=data.scheduled_time,
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post


def get_post_or_404(db: Session, post_id: int, user_id: int) -> Post:
    """
    Fetch a post by id, enforcing ownership.
    Raises 404 if not found, 403 if owned by someone else.
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post {post_id} not found",
        )
    if post.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this post",
        )
    return post


from datetime import datetime, timedelta, timezone


def _seed_default_user_posts(db: Session, user_id: int) -> None:
    """Seed initial starter posts into PostgreSQL for a user if they have 0 posts."""
    now = datetime.now(timezone.utc)
    starter_posts = [
        Post(
            user_id=user_id,
            platform="twitter",
            content="🚀 Exciting news! Our new social media management workflow is live. Schedule, track, and automate posts across all platforms!",
            status="scheduled",
            content_type="text",
            scheduled_time=now + timedelta(days=1),
            created_at=now - timedelta(hours=2),
        ),
        Post(
            user_id=user_id,
            platform="linkedin",
            content="5 key strategies to scale your social media engagement in 2026. Here is a breakdown of what we learned...",
            status="published",
            content_type="text",
            scheduled_time=now - timedelta(days=1),
            published_at=now - timedelta(days=1),
            created_at=now - timedelta(days=2),
        ),
        Post(
            user_id=user_id,
            platform="instagram",
            content="Behind the scenes look at our product team building automated publishing workflows! 📸✨ #saas #growth",
            status="draft",
            content_type="text",
            scheduled_time=now + timedelta(days=3),
            created_at=now - timedelta(hours=5),
        ),
    ]
    db.add_all(starter_posts)
    db.commit()


def list_posts(
    db: Session,
    user_id: int,
    post_status: Optional[str] = None,
    platform: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[Post]:
    """
    Return posts for the current user, with optional filters on
    status and platform. Supports pagination via skip/limit.
    Auto-seeds starter posts into PostgreSQL if user has 0 posts.
    """
    query = db.query(Post).filter(Post.user_id == user_id)

    if query.count() == 0:
        _seed_default_user_posts(db, user_id)
        query = db.query(Post).filter(Post.user_id == user_id)

    if post_status:
        query = query.filter(func.lower(Post.status) == post_status.lower())
    if platform:
        query = query.filter(func.lower(Post.platform) == platform.lower())

    return (
        query
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_post(
    db: Session,
    post_id: int,
    user_id: int,
    data: PostUpdate,
) -> Post:
    """
    Partially update a post. Only fields explicitly provided
    (not None) are written.
    """
    post = get_post_or_404(db, post_id, user_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)

    db.commit()
    db.refresh(post)
    return post


def delete_post(db: Session, post_id: int, user_id: int) -> None:
    """
    Hard-delete a post row. The caller is responsible for also
    removing any linked MongoDB draft document.
    """
    post = get_post_or_404(db, post_id, user_id)
    db.delete(post)
    db.commit()
