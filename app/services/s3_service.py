"""
app/services/s3_service.py
AWS S3 helpers for media upload and deletion.

Upload path: media/{user_id}/{content_type}/{uuid}_{filename}
"""
from __future__ import annotations

import logging
import os
import uuid
from typing import IO, List

logger = logging.getLogger(__name__)

_s3_client = None


def _get_client():
    global _s3_client
    if _s3_client is None:
        import boto3
        _s3_client = boto3.client(
            "s3",
            region_name=os.getenv("AWS_REGION", "ap-south-1"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )
    return _s3_client


def upload_file_to_s3(
    file_obj: IO[bytes],
    original_filename: str,
    mime_type: str,
    user_id: int,
    content_category: str = "media",
) -> str:
    """Upload a file-like object to S3 and return its public URL."""
    from botocore.exceptions import BotoCoreError, ClientError

    bucket = os.getenv("S3_BUCKET_NAME", "socialpilot-media")
    region = os.getenv("AWS_REGION", "ap-south-1")
    base_url = os.getenv("S3_PUBLIC_URL", f"https://{bucket}.s3.{region}.amazonaws.com")

    safe_name = original_filename.replace(" ", "_")
    unique_id = uuid.uuid4().hex
    key = f"media/{user_id}/{content_category}/{unique_id}_{safe_name}"

    try:
        _get_client().upload_fileobj(
            file_obj,
            bucket,
            key,
            ExtraArgs={"ContentType": mime_type, "ACL": "public-read"},
        )
        url = f"{base_url.rstrip('/')}/{key}"
        logger.info("Uploaded %s -> %s", original_filename, url)
        return url
    except (BotoCoreError, ClientError) as exc:
        logger.error("S3 upload failed for %s: %s", original_filename, exc)
        raise RuntimeError(f"S3 upload failed: {exc}") from exc


def delete_files_from_s3(urls: List[str]) -> int:
    """Delete a list of S3 objects by their public URLs. Returns count deleted."""
    if not urls:
        return 0

    from botocore.exceptions import BotoCoreError, ClientError

    bucket = os.getenv("S3_BUCKET_NAME", "socialpilot-media")
    region = os.getenv("AWS_REGION", "ap-south-1")
    base_url = os.getenv("S3_PUBLIC_URL", f"https://{bucket}.s3.{region}.amazonaws.com").rstrip("/")

    keys: List[str] = []
    for url in (urls or []):
        if not url:
            continue
        if url.startswith(base_url):
            key = url[len(base_url):].lstrip("/")
            keys.append(key)
        else:
            logger.warning("delete_files_from_s3: URL not in bucket, skipping: %s", url)

    if not keys:
        return 0

    objects = [{"Key": k} for k in keys]
    try:
        resp = _get_client().delete_objects(
            Bucket=bucket,
            Delete={"Objects": objects, "Quiet": True},
        )
        errors = resp.get("Errors", [])
        for err in errors:
            logger.error("S3 delete error key=%s: %s", err.get("Key"), err.get("Message"))
        deleted = len(keys) - len(errors)
        logger.info("Deleted %d/%d S3 objects", deleted, len(keys))
        return deleted
    except (BotoCoreError, ClientError) as exc:
        logger.error("S3 batch delete failed: %s", exc)
        return 0


def s3_configured() -> bool:
    """Return True if real AWS credentials are present in env."""
    key = os.getenv("AWS_ACCESS_KEY_ID", "")
    secret = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    return bool(key and secret and "your_aws" not in key)
