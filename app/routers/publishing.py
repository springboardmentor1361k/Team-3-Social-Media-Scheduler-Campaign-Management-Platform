"""
app/routers/publishing.py
──────────────────────────
Publishing API — triggers async Celery tasks to push posts to social platforms.

Endpoints
---------
POST /api/v1/publish/{post_id}
    Immediately queue a post for publishing.
    Returns the Celery task ID + a poll URL.

GET  /api/v1/publish/status/{task_id}
    Poll the status of a previously enqueued publish task.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
# AsyncResult is imported lazily inside get_publish_status() to avoid the
# pre-existing celery.py file at the backend root shadowing the celery package
# when Python's sys.path starts from the backend/ directory.

from app.core.security import get_current_user
from app.database import get_db
from app.models.post import Post
from app.models.user import User
from sqlalchemy.orm import Session

# Import the Celery app first so shared_task binds to Redis broker, not default amqp
import celery_worker  # noqa: F401
from tasks.publishing import publish_post

router = APIRouter(prefix="/api/v1/publish", tags=["Publishing"])

SUPPORTED_PLATFORMS = {"facebook", "instagram", "linkedin", "twitter", "x", "youtube"}

# Map UI aliases to canonical stored platform names
_PLATFORM_ALIASES = {"x": "twitter"}


from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks


@router.post("/{post_id}", status_code=status.HTTP_202_ACCEPTED)
def trigger_publish(
    post_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Queue an existing post for immediate publishing.

    Uses Celery broker if available, or FastAPI BackgroundTasks for in-process
    asynchronous execution when Celery is not running.
    """
    # Ownership + existence check
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == current_user.id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post {post_id} not found or does not belong to you",
        )

    platform = _PLATFORM_ALIASES.get((post.platform or "").lower(), (post.platform or "").lower())
    if platform not in SUPPORTED_PLATFORMS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported platform '{post.platform}'. Supported: {', '.join(sorted(SUPPORTED_PLATFORMS))}",
        )

    # Only block posts that have already been successfully published to the platform
    if post.status == "published":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Post {post_id} has already been published to {post.platform}",
        )

    # Update post status to 'queued'
    post.status = "queued"
    db.commit()

    # Try Celery first; fall back to FastAPI BackgroundTasks for async execution
    try:
        task = publish_post.delay(post_id)
        return {
            "message": f"Post {post_id} queued for publishing on {post.platform}.",
            "task_id": task.id,
            "status_url": f"/api/v1/publish/status/{task.id}",
        }
    except Exception as broker_err:
        import logging
        logging.getLogger(__name__).info(
            "Celery broker unavailable — enqueuing post %d via FastAPI BackgroundTasks", post_id
        )
        background_tasks.add_task(publish_post, post_id)
        return {
            "message": f"Post {post_id} queued for asynchronous publishing on {post.platform}.",
            "task_id": f"async_{post_id}",
            "status_url": f"/api/v1/publish/status/async_{post_id}",
        }


@router.get("/status/{task_id}")
def get_publish_status(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Poll the status of a publish Celery task.

    Returns one of:
      PENDING   – task is queued, not yet started
      STARTED   – worker is processing it
      SUCCESS   – published successfully (includes result payload)
      FAILURE   – publish failed (includes error message)
      RETRY     – task is being retried after a transient error
    """
    # Lazy import to avoid celery.py at backend root shadowing the celery package
    from celery.result import AsyncResult  # noqa: PLC0415

    result = AsyncResult(task_id)
    response = {
        "task_id": task_id,
        "state": result.state,
    }

    if result.state == "SUCCESS":
        response["result"] = result.result
    elif result.state == "FAILURE":
        response["error"] = str(result.result)
    elif result.state == "STARTED":
        response["info"] = result.info

    return response