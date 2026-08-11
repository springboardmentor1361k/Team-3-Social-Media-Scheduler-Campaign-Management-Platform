"""
app/core/encryption.py
──────────────────────
Symmetric Fernet encryption for OAuth access/refresh tokens stored in the DB.

Usage
-----
from app.core.encryption import encrypt_token, decrypt_token

stored  = encrypt_token(raw_token)   # store this in social_accounts.access_token
raw     = decrypt_token(stored)       # use this when calling platform APIs

The encryption key is read from the TOKEN_ENCRYPTION_KEY environment variable.
Generate one with:
    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
"""
from __future__ import annotations

import os
import logging

logger = logging.getLogger(__name__)

_fernet = None  # lazy-initialised


def _get_fernet():
    """Return a cached Fernet instance, initialised from env on first call."""
    global _fernet
    if _fernet is not None:
        return _fernet

    key = os.getenv("TOKEN_ENCRYPTION_KEY", "")
    if not key:
        # If no key is configured we fall back to a no-op (pass-through).
        # This preserves backwards-compatibility with existing plain-text tokens
        # while still allowing the app to start during development.
        logger.warning(
            "TOKEN_ENCRYPTION_KEY is not set – tokens will be stored as plain text. "
            "Set this variable in production!"
        )
        return None

    try:
        from cryptography.fernet import Fernet
        _fernet = Fernet(key.encode())
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to initialise Fernet cipher: %s", exc)
        return None

    return _fernet


def encrypt_token(plain: str | None) -> str | None:
    """
    Encrypt *plain* using Fernet symmetric encryption.
    Returns the ciphertext as a UTF-8 string suitable for storage.
    If TOKEN_ENCRYPTION_KEY is not set, returns the original value unchanged.
    """
    if plain is None:
        return None
    f = _get_fernet()
    if f is None:
        return plain
    return f.encrypt(plain.encode()).decode()


def decrypt_token(stored: str | None) -> str | None:
    """
    Decrypt a previously encrypted token.
    If TOKEN_ENCRYPTION_KEY is not set (no-op mode) returns the stored value as-is.
    Raises ValueError if decryption fails (bad key / corrupted data).
    """
    if stored is None:
        return None
    f = _get_fernet()
    if f is None:
        return stored
    try:
        return f.decrypt(stored.encode()).decode()
    except Exception as exc:
        raise ValueError(f"Token decryption failed – possible key mismatch: {exc}") from exc
