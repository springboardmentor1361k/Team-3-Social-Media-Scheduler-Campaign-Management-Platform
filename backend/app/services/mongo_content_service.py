"""
mongo_content_service.py
Async MongoDB operations for content drafts and media metadata.
Uses Motor (AsyncIOMotorClient) via the helpers in app.mongodb.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId

from app.mongodb import get_content_drafts_collection, get_media_collection
from app.schemas.content import MediaMetaCreate


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert ObjectId _id to string so the doc is JSON-serialisable."""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


# ─────────────────────────────────────────────────────────────────────────────
# Content Drafts
# ─────────────────────────────────────────────────────────────────────────────

async def save_draft(
    post_id: int,
    user_id: int,
    raw_content: Optional[str],
    content_type: str,
    platform: str,
    media_refs: Optional[List[str]] = None,
    hashtags: Optional[List[str]] = None,
    mentions: Optional[List[str]] = None,
    extra_metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Upsert a draft document in MongoDB.
    If a draft for the given post_id already exists it is updated in place;
    otherwise a new document is inserted.
    Returns the upserted document (with _id as string).
    """
    collection = get_content_drafts_collection()
    now = _now()

    draft_doc = {
        "post_id": post_id,
        "user_id": user_id,
        "raw_content": raw_content,
        "content_type": content_type,
        "platform": platform,
        "media_refs": media_refs or [],
        "hashtags": hashtags or [],
        "mentions": mentions or [],
        "extra_metadata": extra_metadata or {},
        "updated_at": now,
    }

    result = await collection.find_one_and_update(
        {"post_id": post_id},
        {
            "$set": draft_doc,
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
        return_document=True,  # return the document AFTER update
    )
    return _serialize_doc(result)


async def get_draft(post_id: int) -> Optional[Dict[str, Any]]:
    """Fetch the draft document for a given post_id, or None."""
    collection = get_content_drafts_collection()
    doc = await collection.find_one({"post_id": post_id})
    return _serialize_doc(doc) if doc else None


async def list_drafts(user_id: int) -> List[Dict[str, Any]]:
    """Return all draft documents owned by a user, newest first."""
    collection = get_content_drafts_collection()
    cursor = collection.find({"user_id": user_id}).sort("updated_at", -1)
    return [_serialize_doc(doc) async for doc in cursor]


async def delete_draft(post_id: int) -> bool:
    """
    Remove the draft document for the given post_id.
    Returns True if a document was deleted, False otherwise.
    """
    collection = get_content_drafts_collection()
    result = await collection.delete_one({"post_id": post_id})
    return result.deleted_count > 0


# ─────────────────────────────────────────────────────────────────────────────
# Media Metadata
# ─────────────────────────────────────────────────────────────────────────────

async def save_media_meta(
    user_id: int,
    data: MediaMetaCreate,
) -> Dict[str, Any]:
    """
    Insert a new media metadata document into the media collection.
    Actual file storage is handled externally (e.g. S3); this stores the
    reference and descriptive metadata only.
    """
    collection = get_media_collection()
    doc = {
        "user_id": user_id,
        "filename": data.filename,
        "url": data.url,
        "content_type": data.content_type,
        "size_bytes": data.size_bytes,
        "caption": data.caption,
        "alt_text": data.alt_text,
        "uploaded_at": _now(),
    }
    result = await collection.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


async def list_media(user_id: int) -> List[Dict[str, Any]]:
    """Return all media metadata documents for a user, newest first."""
    collection = get_media_collection()
    cursor = collection.find({"user_id": user_id}).sort("uploaded_at", -1)
    return [_serialize_doc(doc) async for doc in cursor]
