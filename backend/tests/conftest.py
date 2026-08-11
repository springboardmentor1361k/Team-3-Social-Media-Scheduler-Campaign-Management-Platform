"""
tests/conftest.py
──────────────────
Pytest configuration and shared fixtures.
"""
import os
import pytest


@pytest.fixture(autouse=True)
def set_required_env(monkeypatch):
    """
    Ensure the minimum env vars are set so imports don't fail.
    Individual tests can override these using monkeypatch.
    """
    monkeypatch.setenv("SECRET_KEY", "test-secret-key-for-pytest-only")
    monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost/test")
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
    monkeypatch.setenv("MONGODB_URL", "mongodb://localhost:27017")
    monkeypatch.setenv("MONGODB_DB", "socialpilot_test")
