import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "socialpilot")

# Singleton client — reuse across all requests
_client: AsyncIOMotorClient = None


def _get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        # tlsAllowInvalidCertificates fixes Python 3.8 TLS handshake failures with MongoDB Atlas
        is_atlas = "mongodb.net" in MONGODB_URL
        _client = AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=10000,
            **({"tlsAllowInvalidCertificates": True} if is_atlas else {}),
        )
    return _client


def get_mongo_client() -> AsyncIOMotorClient:
    return _get_client()


def get_mongo_db():
    return _get_client()[MONGODB_DB]


# Collections
def get_analytics_collection():
    return get_mongo_db()["analytics"]


def get_campaign_analytics_collection():
    return get_mongo_db()["campaign_analytics"]


def get_media_collection():
    return get_mongo_db()["media"]


def get_content_drafts_collection():
    """
    Stores rich content documents for posts / drafts.
    Each document is keyed by post_id and user_id and holds the full
    content body, media references, hashtags, mentions and any
    platform-specific formatting metadata.
    """
    return get_mongo_db()["content_drafts"]
