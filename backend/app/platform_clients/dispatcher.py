"""
app/platform_clients/dispatcher.py
────────────────────────────────────
Maps a platform name string to the correct platform client and
dispatches a publish call.

Usage (from tasks/publishing.py)
---------------------------------
from app.platform_clients.dispatcher import dispatch_publish
from app.platform_clients.base import PostPayload

result = dispatch_publish(payload)
"""
from __future__ import annotations

import logging
from typing import Dict, Type

from app.platform_clients.base import BasePlatformClient, PostPayload, PublishResult
from app.platform_clients.facebook import FacebookClient
from app.platform_clients.instagram import InstagramClient
from app.platform_clients.linkedin import LinkedInClient
from app.platform_clients.twitter_x import TwitterXClient
from app.platform_clients.youtube import YouTubeClient

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Registry: platform name → client class
# Add new platforms here without touching any other code.
# ──────────────────────────────────────────────────────────────────────────────
_REGISTRY: Dict[str, Type[BasePlatformClient]] = {
    "facebook":  FacebookClient,
    "instagram": InstagramClient,
    "linkedin":  LinkedInClient,
    "twitter":   TwitterXClient,   # stored as "twitter" in the DB (Platform enum)
    "x":         TwitterXClient,   # alias accepted for forwards-compat
    "youtube":   YouTubeClient,
}


def get_client(platform: str) -> BasePlatformClient:
    """
    Return an instantiated client for *platform*.

    Raises
    ------
    ValueError
        If the platform is not supported.
    """
    key = platform.strip().lower()
    client_cls = _REGISTRY.get(key)
    if client_cls is None:
        supported = ", ".join(sorted(_REGISTRY))
        raise ValueError(
            f"Unsupported platform '{platform}'. Supported: {supported}"
        )
    return client_cls()


def dispatch_publish(payload: PostPayload) -> PublishResult:
    """
    Resolve the correct platform client and call its :meth:`publish` method.

    Parameters
    ----------
    payload : PostPayload
        The normalised post data to publish.

    Returns
    -------
    PublishResult
        The outcome of the publish attempt.
    """
    try:
        client = get_client(payload.platform)
    except ValueError as exc:
        logger.error("dispatch_publish: %s", exc)
        return PublishResult(success=False, error_message=str(exc))

    logger.info(
        "Dispatching post %d to %s (account: %s)",
        payload.post_id,
        payload.platform,
        payload.platform_account_id,
    )
    result = client.publish(payload)

    if result.success:
        logger.info(
            "Post %d published to %s — platform_post_id=%s",
            payload.post_id,
            payload.platform,
            result.platform_post_id,
        )
    else:
        logger.error(
            "Post %d failed on %s — %s",
            payload.post_id,
            payload.platform,
            result.error_message,
        )

    return result
