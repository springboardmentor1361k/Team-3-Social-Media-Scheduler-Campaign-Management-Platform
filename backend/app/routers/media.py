"""
app/routers/media.py
────────────────────
Media upload / delete endpoints.

POST /api/v1/media/upload  — upload files to AWS S3
DELETE /api/v1/media/delete — batch-delete S3 objects by URL
"""
from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.core.security import get_current_user
from app.models.user import User
from app.services.s3_service import delete_files_from_s3, s3_configured, upload_file_to_s3

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/media", tags=["Media"])

# ── Constants ─────────────────────────────────────────────────────────────────
MAX_FILES = 10
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB
ALLOWED_MIME_PREFIXES = ("image/", "video/")


# ── Schemas ───────────────────────────────────────────────────────────────────
class DeleteMediaRequest(BaseModel):
    urls: List[str]


class UploadResponse(BaseModel):
    urls: List[str]
    count: int


class DeleteResponse(BaseModel):
    deleted: int


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=UploadResponse)
async def upload_media(
    files: List[UploadFile] = File(...),
    content_type: str = Form("media"),
    current_user: User = Depends(get_current_user),
):
    """
    Upload one or more media files to AWS S3.

    - **files**: multipart file uploads (images / videos)
    - **content_type**: post content category — image | video | carousel | story | reel | media

    Returns list of public S3 URLs.
    """
    if not s3_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "S3 storage is not configured. "
                "Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, "
                "S3_BUCKET_NAME and S3_PUBLIC_URL in your .env file."
            ),
        )

    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Too many files. Maximum allowed: {MAX_FILES}",
        )

    uploaded_urls: List[str] = []

    for upload in files:
        # Validate MIME type
        mime = upload.content_type or ""
        if not any(mime.startswith(p) for p in ALLOWED_MIME_PREFIXES):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported file type '{mime}'. Only images and videos are allowed.",
            )

        # Read and validate file size
        file_bytes = await upload.read()
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File '{upload.filename}' exceeds the 25 MB size limit.",
            )

        # Reset stream and upload to S3
        import io
        file_stream = io.BytesIO(file_bytes)

        try:
            url = upload_file_to_s3(
                file_obj=file_stream,
                original_filename=upload.filename or "upload",
                mime_type=mime,
                user_id=current_user.id,
                content_category=content_type.lower(),
            )
            uploaded_urls.append(url)
        except RuntimeError as exc:
            logger.error("Upload failed for %s: %s", upload.filename, exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload '{upload.filename}': {exc}",
            ) from exc

    logger.info(
        "User %d uploaded %d file(s) [content_type=%s]",
        current_user.id,
        len(uploaded_urls),
        content_type,
    )
    return UploadResponse(urls=uploaded_urls, count=len(uploaded_urls))


@router.delete("/delete", response_model=DeleteResponse)
async def delete_media(
    body: DeleteMediaRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Batch-delete S3 objects by their public URLs.

    Only objects whose URL starts with the configured S3_PUBLIC_URL are deleted.
    URLs from other domains are silently skipped.
    """
    if not s3_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="S3 storage is not configured.",
        )

    deleted = delete_files_from_s3(body.urls)
    logger.info("User %d deleted %d S3 object(s)", current_user.id, deleted)
    return DeleteResponse(deleted=deleted)

