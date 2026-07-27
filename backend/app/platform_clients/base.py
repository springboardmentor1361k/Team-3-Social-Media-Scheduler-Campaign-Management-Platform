"""
app/platform_clients/base.py
────────────────────────────
Abstract base class that every platform client must implement.

Each subclass receives a decrypted access_token (and optionally a refresh_token)
and must implement the `publish` method which pushes the post payload to the
respective social platform and returns a result dict.
"""
from __future__ import annotations

import abc
from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass
class PostPayload:
    """
    A normalised, platform-agnostic representation of a post to be published.

    Attributes
    ----------
    post_id         : Internal DB id of the post
    platform        : Target platform (facebook | instagram | linkedin | twitter | youtube)
    content_type    : text | image | video | carousel | story | reel
    text            : The text body of the post
    media_urls      : List of publicly reachable media URLs (images / videos)
    extra_metadata  : Platform-specific overrides passed through from MongoDB draft
    access_token    : Decrypted OAuth access token for the platform account
    refresh_token   : Decrypted OAuth refresh token (may be None)
    platform_account_id : Page/channel/profile ID on the target platform
    """
    post_id: int
    platform: str
    content_type: str
    text: Optional[str]
    media_urls: List[str]
    extra_metadata: Dict[str, Any]
    access_token: str
    refresh_token: Optional[str]
    platform_account_id: str


@dataclass
class PublishResult:
    """
    Returned by every `publish()` call.

    Attributes
    ----------
    success         : True if the platform accepted the post
    platform_post_id: The native post/tweet/video ID assigned by the platform
    raw_response    : The full API response payload for logging / debugging
    error_message   : Human-readable error (only populated when success=False)
    """
    success: bool
    platform_post_id: Optional[str] = None
    raw_response: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class BasePlatformClient(abc.ABC):
    """
    Abstract base class for platform clients.

    Subclasses must implement :meth:`publish` which receives a :class:`PostPayload`
    and returns a :class:`PublishResult`.
    """

    @abc.abstractmethod
    def publish(self, payload: PostPayload) -> PublishResult:
        """Push *payload* to the social platform and return a result."""
        ...
