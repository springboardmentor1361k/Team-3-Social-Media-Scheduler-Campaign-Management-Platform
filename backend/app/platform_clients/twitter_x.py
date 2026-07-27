"""
app/platform_clients/twitter_x.py
──────────────────────────────────
X (Twitter) API v2 client using Tweepy.

Supported content types
-----------------------
  text    → `client.create_tweet(text=...)`
  image   → upload media via v1.1 API, attach media_ids to v2 tweet
  video   → upload chunked media via v1.1 API, attach media_id to v2 tweet
  carousel → up to 4 images attached to a single tweet

Character limits enforced by the API (not here):
  Standard: 280 chars  |  Blue/Premium: 25 000 chars

Required env vars
-----------------
  TWITTER_API_KEY            – OAuth 1.0a Consumer Key
  TWITTER_API_SECRET         – OAuth 1.0a Consumer Secret
  TWITTER_ACCESS_TOKEN       – OAuth 1.0a Access Token
  TWITTER_ACCESS_TOKEN_SECRET– OAuth 1.0a Access Token Secret
  TWITTER_BEARER_TOKEN       – App-only Bearer Token (for read ops; optional here)

Per-user (OAuth 2 PKCE) tokens can also be stored in social_account
as an alternative to the app-level OAuth 1.0a tokens, but require a
different Tweepy Client initialisation (Bearer Token flow).

References
----------
  https://docs.tweepy.org/en/stable/client.html
  https://docs.tweepy.org/en/stable/api.html   (v1.1 for media upload)
"""
from __future__ import annotations

import logging
import os
from typing import List, Optional

import httpx

from app.platform_clients.base import BasePlatformClient, PostPayload, PublishResult

logger = logging.getLogger(__name__)


class TwitterXClient(BasePlatformClient):
    """
    Publishes tweets (text, images, videos) to X (Twitter) via Tweepy.

    Token strategy
    ──────────────
    Tweepy requires OAuth 1.0a user-context credentials to create tweets.
    The stored ``access_token`` in SocialAccount is expected to be a JSON
    string containing both ``oauth_token`` and ``oauth_token_secret``:
        '{"oauth_token": "...", "oauth_token_secret": "..."}'
    Alternatively, if the token is a plain string we treat it as the
    ``oauth_token`` and expect the secret in ``refresh_token``.
    """

    def publish(self, payload: PostPayload) -> PublishResult:
        import tweepy  # imported lazily so missing package gives a clear error

        # ── Resolve credentials ───────────────────────────────────────────────
        api_key = os.getenv("TWITTER_API_KEY", "")
        api_secret = os.getenv("TWITTER_API_SECRET", "")

        # Parse stored token (either JSON dict or plain string + refresh_token as secret)
        oauth_token, oauth_secret = self._resolve_tokens(payload)

        if not all([api_key, api_secret, oauth_token, oauth_secret]):
            return PublishResult(
                success=False,
                error_message=(
                    "Missing Twitter credentials. "
                    "Ensure TWITTER_API_KEY, TWITTER_API_SECRET are set in .env "
                    "and the account's access_token / refresh_token are populated."
                ),
            )

        # ── Build Tweepy clients ──────────────────────────────────────────────
        # v1.1 API (media upload)
        auth = tweepy.OAuth1UserHandler(api_key, api_secret, oauth_token, oauth_secret)
        api_v1 = tweepy.API(auth)

        # v2 client (create_tweet)
        client_v2 = tweepy.Client(
            consumer_key=api_key,
            consumer_secret=api_secret,
            access_token=oauth_token,
            access_token_secret=oauth_secret,
        )

        try:
            content_type = payload.content_type.lower()
            text = payload.text or ""

            media_ids: List[str] = []
            if content_type in ("image", "carousel") and payload.media_urls:
                media_ids = self._upload_images(api_v1, payload.media_urls)

            elif content_type in ("video", "reel") and payload.media_urls:
                media_id = self._upload_video(api_v1, payload.media_urls[0])
                if media_id:
                    media_ids = [media_id]

            # Create the tweet
            tweet_kwargs = {"text": text}
            if media_ids:
                tweet_kwargs["media_ids"] = media_ids

            response = client_v2.create_tweet(**tweet_kwargs)
            tweet_id = str(response.data["id"]) if response.data else None
            return PublishResult(
                success=True,
                platform_post_id=tweet_id,
                raw_response={"id": tweet_id, "text": text},
            )

        except tweepy.TweepyException as exc:
            err_str = str(exc)
            if "402" in err_str or "Payment Required" in err_str or "credits depleted" in err_str.lower():
                msg = (
                    "Twitter/X API 402: Posting tweets requires the X Basic API plan ($100/month). "
                    "Your current Free tier only allows reading. "
                    "Upgrade at https://developer.x.com/en/portal/products"
                )
                logger.error("Tweepy error: %s", msg)
                return PublishResult(success=False, error_message=msg)
            logger.error("Tweepy error: %s", exc)
            return PublishResult(success=False, error_message=err_str)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Unexpected Twitter/X publish error")
            return PublishResult(success=False, error_message=str(exc))

    # ──────────────────────────────────────────────────────────────────────────
    # Private helpers
    # ──────────────────────────────────────────────────────────────────────────

    def _resolve_tokens(self, payload: PostPayload):
        """Return (oauth_token, oauth_token_secret) from stored account credentials."""
        import json
        token_str = payload.access_token or ""
        try:
            parsed = json.loads(token_str)
            return parsed.get("oauth_token", ""), parsed.get("oauth_token_secret", "")
        except (json.JSONDecodeError, TypeError):
            # Fallback: token is the oauth_token, refresh_token is the secret
            return token_str, payload.refresh_token or ""

    def _upload_images(self, api_v1, image_urls: List[str]) -> List[str]:
        """Download image URLs and upload to Twitter v1.1 media endpoint."""
        media_ids = []
        for url in image_urls[:4]:  # Twitter allows max 4 images per tweet
            media_bytes = self._download_bytes(url)
            if media_bytes is None:
                continue
            media = api_v1.media_upload(filename="image.jpg", file=__import__("io").BytesIO(media_bytes))
            media_ids.append(str(media.media_id))
        return media_ids

    def _upload_video(self, api_v1, video_url: str) -> Optional[str]:
        """Download video and chunked-upload via v1.1 INIT/APPEND/FINALIZE."""
        media_bytes = self._download_bytes(video_url)
        if media_bytes is None:
            return None
        import io
        media = api_v1.media_upload(
            filename="video.mp4",
            file=io.BytesIO(media_bytes),
            media_type="video/mp4",
            chunked=True,
        )
        return str(media.media_id)

    @staticmethod
    def _download_bytes(url: str) -> Optional[bytes]:
        """Download a URL to bytes; returns None on failure."""
        try:
            resp = httpx.get(url, timeout=60, follow_redirects=True)
            resp.raise_for_status()
            return resp.content
        except Exception as exc:  # noqa: BLE001
            logger.error("Failed to download media from %s: %s", url, exc)
            return None
