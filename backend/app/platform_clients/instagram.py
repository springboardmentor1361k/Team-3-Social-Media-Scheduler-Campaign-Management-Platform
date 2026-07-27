"""
app/platform_clients/instagram.py
──────────────────────────────────
Instagram Graph API client (via Facebook Graph API).

Instagram publishing uses a 2-step container → publish flow:
  1. Create a media container → returns a container_id
  2. Publish the container   → returns the media_id

Supported content types
-----------------------
  image  → single image (IMAGE container)
  reel   → Reels (REELS container, video URL required)
  story  → Stories (requires stories permission)
  carousel → multiple images (create child containers, then CAROUSEL container)

Required app permissions
------------------------
  instagram_basic, instagram_content_publish, pages_read_engagement

Required env vars
-----------------
  FACEBOOK_APP_ID       – App ID (shared with Facebook)
  FACEBOOK_APP_SECRET   – App secret

The access_token in social_account must be a **Page Access Token** for the
Facebook Page connected to the Instagram Business/Creator account.
The platform_account_id must be the **Instagram Business Account ID**
(not the Facebook Page ID).

References
----------
  https://developers.facebook.com/docs/instagram-api/reference/ig-user/media
  https://developers.facebook.com/docs/instagram-api/reference/ig-user/media_publish
"""
from __future__ import annotations

import logging
import time

import httpx

from app.platform_clients.base import BasePlatformClient, PostPayload, PublishResult

logger = logging.getLogger(__name__)

GRAPH_BASE = "https://graph.facebook.com/v19.0"
CONTAINER_POLL_MAX = 10   # max attempts waiting for VIDEO_AWATING_UPLOAD → FINISHED
CONTAINER_POLL_DELAY = 6  # seconds between polls


class InstagramClient(BasePlatformClient):
    """
    Publishes images, reels, stories, and carousels to an Instagram
    Business / Creator account via the Instagram Graph API.
    """

    def publish(self, payload: PostPayload) -> PublishResult:  # noqa: C901
        ig_user_id = payload.platform_account_id
        token = payload.access_token
        caption = payload.text or ""

        try:
            content_type = payload.content_type.lower()

            if content_type == "carousel" and len(payload.media_urls) > 1:
                return self._publish_carousel(ig_user_id, token, caption, payload.media_urls)

            if content_type in ("reel", "video") and payload.media_urls:
                return self._publish_reel(ig_user_id, token, caption, payload.media_urls[0])

            if content_type == "story" and payload.media_urls:
                return self._publish_story(ig_user_id, token, payload.media_urls[0])

            # Default: single image
            if payload.media_urls:
                return self._publish_image(ig_user_id, token, caption, payload.media_urls[0])

            return PublishResult(
                success=False,
                error_message="Instagram requires at least one media URL for all content types",
            )

        except httpx.HTTPStatusError as exc:
            error_body = exc.response.text
            logger.error("Instagram API error %s: %s", exc.response.status_code, error_body)
            return PublishResult(success=False, error_message=f"HTTP {exc.response.status_code}: {error_body}")
        except Exception as exc:  # noqa: BLE001
            logger.exception("Unexpected Instagram publish error")
            return PublishResult(success=False, error_message=str(exc))

    # ──────────────────────────────────────────────────────────────────────────
    # Private helpers
    # ──────────────────────────────────────────────────────────────────────────

    def _create_image_container(self, ig_user_id: str, token: str, image_url: str, caption: str) -> str:
        url = f"{GRAPH_BASE}/{ig_user_id}/media"
        resp = httpx.post(url, params={
            "image_url": image_url,
            "caption": caption,
            "access_token": token,
        }, timeout=30)
        resp.raise_for_status()
        return resp.json()["id"]

    def _create_video_container(self, ig_user_id: str, token: str, video_url: str,
                                caption: str, media_type: str = "REELS") -> str:
        url = f"{GRAPH_BASE}/{ig_user_id}/media"
        resp = httpx.post(url, params={
            "media_type": media_type,
            "video_url": video_url,
            "caption": caption,
            "access_token": token,
        }, timeout=30)
        resp.raise_for_status()
        container_id = resp.json()["id"]
        self._wait_for_container(ig_user_id, token, container_id)
        return container_id

    def _wait_for_container(self, ig_user_id: str, token: str, container_id: str) -> None:
        """Poll container status until FINISHED (or give up after max attempts)."""
        for _ in range(CONTAINER_POLL_MAX):
            resp = httpx.get(
                f"{GRAPH_BASE}/{container_id}",
                params={"fields": "status_code", "access_token": token},
                timeout=15,
            )
            resp.raise_for_status()
            status_code = resp.json().get("status_code", "")
            if status_code == "FINISHED":
                return
            if status_code == "ERROR":
                raise RuntimeError("Instagram container processing failed (status: ERROR)")
            time.sleep(CONTAINER_POLL_DELAY)
        logger.warning("Container %s did not reach FINISHED in time – attempting publish anyway", container_id)

    def _publish_container(self, ig_user_id: str, token: str, container_id: str) -> PublishResult:
        url = f"{GRAPH_BASE}/{ig_user_id}/media_publish"
        resp = httpx.post(url, params={
            "creation_id": container_id,
            "access_token": token,
        }, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return PublishResult(success=True, platform_post_id=data.get("id"), raw_response=data)

    def _publish_image(self, ig_user_id: str, token: str, caption: str, image_url: str) -> PublishResult:
        container_id = self._create_image_container(ig_user_id, token, image_url, caption)
        return self._publish_container(ig_user_id, token, container_id)

    def _publish_reel(self, ig_user_id: str, token: str, caption: str, video_url: str) -> PublishResult:
        container_id = self._create_video_container(ig_user_id, token, video_url, caption, media_type="REELS")
        return self._publish_container(ig_user_id, token, container_id)

    def _publish_story(self, ig_user_id: str, token: str, media_url: str) -> PublishResult:
        # Stories: image or video based on URL extension heuristic
        url = f"{GRAPH_BASE}/{ig_user_id}/media"
        is_video = any(media_url.lower().endswith(ext) for ext in (".mp4", ".mov", ".avi"))
        params = {
            "media_type": "STORIES",
            "access_token": token,
        }
        if is_video:
            params["video_url"] = media_url
        else:
            params["image_url"] = media_url

        resp = httpx.post(url, params=params, timeout=30)
        resp.raise_for_status()
        container_id = resp.json()["id"]
        if is_video:
            self._wait_for_container(ig_user_id, token, container_id)
        return self._publish_container(ig_user_id, token, container_id)

    def _publish_carousel(self, ig_user_id: str, token: str, caption: str, media_urls: list) -> PublishResult:
        # Step 1: create a child container per image
        child_ids = []
        for img_url in media_urls[:10]:  # Instagram supports up to 10 carousel items
            resp = httpx.post(
                f"{GRAPH_BASE}/{ig_user_id}/media",
                params={"image_url": img_url, "is_carousel_item": "true", "access_token": token},
                timeout=30,
            )
            resp.raise_for_status()
            child_ids.append(resp.json()["id"])

        # Step 2: create the carousel container
        resp = httpx.post(
            f"{GRAPH_BASE}/{ig_user_id}/media",
            params={
                "media_type": "CAROUSEL",
                "children": ",".join(child_ids),
                "caption": caption,
                "access_token": token,
            },
            timeout=30,
        )
        resp.raise_for_status()
        container_id = resp.json()["id"]
        return self._publish_container(ig_user_id, token, container_id)
