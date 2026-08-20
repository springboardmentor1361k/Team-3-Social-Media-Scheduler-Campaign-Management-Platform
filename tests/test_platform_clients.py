"""
tests/test_platform_clients.py
────────────────────────────────
Unit-level tests for platform clients.

These tests mock the external HTTP calls (httpx / tweepy / googleapiclient)
so they run without real API credentials.

Run with:
    pytest tests/ -v
"""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.platform_clients.base import PostPayload, PublishResult
from app.platform_clients.dispatcher import dispatch_publish, get_client


# ── Shared fixture ─────────────────────────────────────────────────────────────

def _make_payload(**overrides) -> PostPayload:
    defaults = dict(
        post_id=1,
        platform="facebook",
        content_type="text",
        text="Hello World!",
        media_urls=[],
        extra_metadata={},
        access_token="FAKE_TOKEN",
        refresh_token=None,
        platform_account_id="123456789",
    )
    defaults.update(overrides)
    return PostPayload(**defaults)


# ══════════════════════════════════════════════════════════════════════════════
# Dispatcher tests
# ══════════════════════════════════════════════════════════════════════════════

class TestDispatcher:
    def test_unsupported_platform_returns_failure(self):
        payload = _make_payload(platform="myspace")
        result = dispatch_publish(payload)
        assert result.success is False
        assert "myspace" in result.error_message.lower()

    def test_get_client_facebook(self):
        from app.platform_clients.facebook import FacebookClient
        assert isinstance(get_client("facebook"), FacebookClient)

    def test_get_client_instagram(self):
        from app.platform_clients.instagram import InstagramClient
        assert isinstance(get_client("instagram"), InstagramClient)

    def test_get_client_linkedin(self):
        from app.platform_clients.linkedin import LinkedInClient
        assert isinstance(get_client("linkedin"), LinkedInClient)

    def test_get_client_twitter(self):
        from app.platform_clients.twitter_x import TwitterXClient
        assert isinstance(get_client("twitter"), TwitterXClient)

    def test_get_client_x_alias(self):
        from app.platform_clients.twitter_x import TwitterXClient
        assert isinstance(get_client("x"), TwitterXClient)

    def test_get_client_youtube(self):
        from app.platform_clients.youtube import YouTubeClient
        assert isinstance(get_client("youtube"), YouTubeClient)

    def test_get_client_case_insensitive(self):
        from app.platform_clients.facebook import FacebookClient
        assert isinstance(get_client("FACEBOOK"), FacebookClient)
        assert isinstance(get_client("Facebook"), FacebookClient)


# ══════════════════════════════════════════════════════════════════════════════
# Facebook client tests
# ══════════════════════════════════════════════════════════════════════════════

class TestFacebookClient:

    @patch("app.platform_clients.facebook.httpx.post")
    def test_publish_text_success(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"id": "page_123_post_456"}
        mock_resp.raise_for_status.return_value = None
        mock_post.return_value = mock_resp

        from app.platform_clients.facebook import FacebookClient
        result = FacebookClient().publish(_make_payload(platform="facebook"))
        assert result.success is True
        assert result.platform_post_id == "page_123_post_456"

    @patch("app.platform_clients.facebook.httpx.post")
    def test_publish_image_success(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"post_id": "123_456"}
        mock_resp.raise_for_status.return_value = None
        mock_post.return_value = mock_resp

        from app.platform_clients.facebook import FacebookClient
        result = FacebookClient().publish(_make_payload(
            platform="facebook",
            content_type="image",
            media_urls=["https://example.com/image.jpg"],
        ))
        assert result.success is True

    @patch("app.platform_clients.facebook.httpx.post")
    def test_publish_api_error(self, mock_post):
        import httpx
        mock_post.side_effect = httpx.HTTPStatusError(
            "Bad Request", request=MagicMock(), response=MagicMock(status_code=400, text='{"error":"invalid"}')
        )

        from app.platform_clients.facebook import FacebookClient
        result = FacebookClient().publish(_make_payload(platform="facebook"))
        assert result.success is False
        assert "400" in result.error_message


# ══════════════════════════════════════════════════════════════════════════════
# LinkedIn client tests
# ══════════════════════════════════════════════════════════════════════════════

class TestLinkedInClient:

    @patch("app.platform_clients.linkedin.httpx.post")
    def test_publish_text_success(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"id": "urn:li:ugcPost:12345"}
        mock_resp.headers = {"x-restli-id": "urn:li:ugcPost:12345"}
        mock_resp.content = b'{"id": "urn:li:ugcPost:12345"}'
        mock_resp.raise_for_status.return_value = None
        mock_post.return_value = mock_resp

        from app.platform_clients.linkedin import LinkedInClient
        result = LinkedInClient().publish(_make_payload(
            platform="linkedin",
            platform_account_id="urn:li:person:ABC",
        ))
        assert result.success is True


# ══════════════════════════════════════════════════════════════════════════════
# Encryption tests
# ══════════════════════════════════════════════════════════════════════════════

class TestEncryption:

    def test_roundtrip_with_key(self):
        from cryptography.fernet import Fernet
        import os

        key = Fernet.generate_key().decode()
        os.environ["TOKEN_ENCRYPTION_KEY"] = key

        # Reset cached _fernet
        import app.core.encryption as enc_mod
        enc_mod._fernet = None

        from app.core.encryption import encrypt_token, decrypt_token
        plain = "my_super_secret_access_token"
        encrypted = encrypt_token(plain)
        assert encrypted != plain
        assert decrypt_token(encrypted) == plain

        # Cleanup
        del os.environ["TOKEN_ENCRYPTION_KEY"]
        enc_mod._fernet = None

    def test_passthrough_without_key(self):
        import os
        os.environ.pop("TOKEN_ENCRYPTION_KEY", None)

        import app.core.encryption as enc_mod
        enc_mod._fernet = None

        from app.core.encryption import encrypt_token, decrypt_token
        plain = "my_token"
        assert encrypt_token(plain) == plain
        assert decrypt_token(plain) == plain

        enc_mod._fernet = None

    def test_none_passthrough(self):
        from app.core.encryption import encrypt_token, decrypt_token
        assert encrypt_token(None) is None
        assert decrypt_token(None) is None
