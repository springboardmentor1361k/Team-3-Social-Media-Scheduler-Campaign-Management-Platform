"""
tasks/publishing.py
────────────────────
Celery tasks responsible for scheduling detection and post publishing.

Tasks
-----
check_and_publish_scheduled_posts
    Beat task — runs every 60 s (configured in celery_worker.py).
    Queries PostgreSQL for posts that are due and dispatches publish_post.

publish_post
    Worker task — loads a post + its social account, builds the PostPayload,
    calls dispatch_publish(), and updates the post status in the DB.
    Retries up to 3 times with exponential back-off on transient errors.
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

from celery import shared_task

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Helper: build a SQLAlchemy session inside a Celery task
# (Can't use FastAPI dependency injection here)
# ──────────────────────────────────────────────────────────────────────────────

def _get_db_session():
    """Return a new SQLAlchemy Session for use inside a Celery task."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL environment variable is not set")

    engine = create_engine(db_url, pool_pre_ping=True)
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return Session()


# ══════════════════════════════════════════════════════════════════════════════
# Beat task: find and dispatch due scheduled posts
# ══════════════════════════════════════════════════════════════════════════════

@shared_task(bind=True, name="tasks.publishing.check_and_publish_scheduled_posts")
def check_and_publish_scheduled_posts(self):
    """
    Beat task: runs every 60 s.
    Fetches posts where status='scheduled' and scheduled_time <= now(UTC),
    then dispatches publish_post per post.
    """
    from app.models.post import Post

    db = _get_db_session()
    dispatched = []
    try:
        now_utc = datetime.now(timezone.utc)
        due_posts = (
            db.query(Post)
            .filter(
                Post.status == "scheduled",
                Post.scheduled_time <= now_utc,
            )
            .all()
        )

        for post in due_posts:
            # Mark as 'queued' to avoid double-dispatch on the next tick
            post.status = "queued"
            db.commit()

            try:
                task = publish_post.delay(post.id)
                dispatched.append({"post_id": post.id, "task_id": task.id})
                logger.info("Scheduled post %d dispatched → task %s", post.id, task.id)
            except Exception as broker_err:
                logger.info("Celery broker down (%s) — executing publish_post directly for scheduled post %d", broker_err, post.id)
                publish_post(post.id)
                dispatched.append({"post_id": post.id, "task_id": "direct"})

    except Exception as exc:  # noqa: BLE001
        logger.exception("check_and_publish_scheduled_posts failed: %s", exc)
    finally:
        db.close()

    return {"status": "checked", "dispatched": dispatched}


# ══════════════════════════════════════════════════════════════════════════════
# Worker task: publish a single post to its platform
# ══════════════════════════════════════════════════════════════════════════════

@shared_task(bind=True, name="tasks.publishing.publish_post", max_retries=3)
def publish_post(self, post_id: int):
    """
    Publish a single post to its target social platform via the platform API.

    Steps
    -----
    1. Load Post + SocialAccount from PostgreSQL.
    2. Decrypt the stored OAuth tokens.
    3. Fetch extra metadata from MongoDB draft (if available).
    4. Build a PostPayload and call dispatch_publish().
    5. Update Post.status → 'published' or 'failed'.
    6. Retry up to 3 times with exponential back-off on transient failures.
    """
    from app.models.post import Post
    from app.models.social_account import SocialAccount
    from app.core.encryption import decrypt_token
    from app.platform_clients.base import PostPayload
    from app.platform_clients.dispatcher import dispatch_publish

    db = _get_db_session()
    try:
        # ── 1. Load Post ──────────────────────────────────────────────────────
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            logger.error("publish_post: Post %d not found", post_id)
            return {"post_id": post_id, "status": "error", "error": "Post not found"}

        # ── 2. Load SocialAccount ─────────────────────────────────────────────
        account = db.query(SocialAccount).filter(
            SocialAccount.id == post.social_account_id
        ).first()
        if not account:
            logger.error("publish_post: SocialAccount %d not found for post %d",
                         post.social_account_id, post_id)
            _mark_failed(db, post, "Social account not found")
            return {"post_id": post_id, "status": "failed", "error": "Social account not found"}

        # ── 3. Decrypt tokens ─────────────────────────────────────────────────
        try:
            access_token = decrypt_token(account.access_token)
            refresh_token = decrypt_token(account.refresh_token)
        except ValueError as exc:
            logger.error("Token decryption failed for account %d: %s", account.id, exc)
            _mark_failed(db, post, f"Token decryption error: {exc}")
            return {"post_id": post_id, "status": "failed", "error": str(exc)}

        # ── 4. Fetch MongoDB draft metadata (optional, best-effort) ───────────
        # NOTE: Use sync PyMongo directly here — Motor (async) cannot be called
        # via asyncio.run() inside a Celery/threadpool context because it was
        # initialized in FastAPI's event loop (different loop error).
        extra_metadata: dict = {}
        try:
            import pymongo
            mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
            mongo_db  = os.getenv("MONGODB_DB", "socialpilot")
            is_atlas  = "mongodb.net" in mongo_url
            sync_client = pymongo.MongoClient(
                mongo_url,
                serverSelectionTimeoutMS=4000,
                connectTimeoutMS=4000,
                socketTimeoutMS=8000,
                **({"tlsAllowInvalidCertificates": True} if is_atlas else {}),
            )
            draft = sync_client[mongo_db]["content_drafts"].find_one({"post_id": post_id})
            sync_client.close()
            if draft:
                extra_metadata = draft.get("extra_metadata", {})
        except Exception as exc:  # noqa: BLE001
            logger.warning("MongoDB draft fetch skipped for post %d: %s", post_id, type(exc).__name__)


        # ── 5. Build PostPayload ──────────────────────────────────────────────
        payload = PostPayload(
            post_id=post.id,
            platform=post.platform,
            content_type=post.content_type,
            text=post.content,
            media_urls=post.media_urls or [],
            extra_metadata=extra_metadata,
            access_token=access_token,
            refresh_token=refresh_token,
            platform_account_id=account.platform_account_id,
        )

        # ── 6. Dispatch to platform ───────────────────────────────────────────
        result = dispatch_publish(payload)

        # ── 7. Update Post status ─────────────────────────────────────────────
        if result.success:
            post.status = "published"
            post.published_at = datetime.now(timezone.utc)
            db.commit()
            logger.info("Post %d published successfully (platform_post_id=%s)", post_id, result.platform_post_id)
            return {
                "post_id": post_id,
                "status": "published",
                "platform_post_id": result.platform_post_id,
                "platform": post.platform,
            }
        else:
            _mark_failed(db, post, result.error_message)
            return {
                "post_id": post_id,
                "status": "failed",
                "error": result.error_message,
            }

    except Exception as exc:  # noqa: BLE001
        logger.exception("publish_post task exception for post %d: %s", post_id, exc)
        db.rollback()
        # Retry with exponential back-off: 30s, 60s, 120s
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 30)
    finally:
        db.close()


# ──────────────────────────────────────────────────────────────────────────────
# Utility
# ──────────────────────────────────────────────────────────────────────────────

def _mark_failed(db, post, error_message: str) -> None:
    """Set post.status = 'failed' and commit."""
    try:
        post.status = "failed"
        db.commit()
    except Exception:  # noqa: BLE001
        db.rollback()
    logger.error("Post %d marked as FAILED: %s", post.id, error_message)
