# tasks/analytics.py

from celery import shared_task
import logging

# Import SessionLocal from your database.py file
from app.database import SessionLocal
# Import the service logic
from app.services.analytics_service import aggregate_campaign_metrics

logger = logging.getLogger(__name__)

from app.mongodb import get_analytics_collection
from app.platform_clients.dispatcher import get_client
from app.models.post import Post
from app.models.social_account import SocialAccount
from app.core.encryption import decrypt_token
from datetime import datetime, timezone

@shared_task(bind=True, name="tasks.analytics.collect_post_analytics", max_retries=3)
def collect_post_analytics(self, post_id: int):
    """
    Fetches metrics from the platform API and stores them in MongoDB analytics collection.
    """
    db = SessionLocal()
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            return {"post_id": post_id, "status": "post_not_found"}
            
        if post.status != "published" or not post.platform_post_id:
            return {"post_id": post_id, "status": "not_published_or_missing_id"}

        account = db.query(SocialAccount).filter(SocialAccount.id == post.social_account_id).first()
        if not account:
            return {"post_id": post_id, "status": "account_not_found"}

        try:
            access_token = decrypt_token(account.access_token)
        except Exception as e:
            logger.error(f"Failed to decrypt token for account {account.id}: {e}")
            return {"post_id": post_id, "status": "decryption_error"}

        try:
            client = get_client(post.platform)
            metrics = client.get_engagement(post.platform_post_id, access_token)
        except Exception as e:
            logger.error(f"Failed to fetch engagement for post {post_id} on {post.platform}: {e}")
            raise self.retry(exc=e, countdown=60)
            
        # Store in MongoDB
        import asyncio
        import motor.motor_asyncio
        import os

        # We must use a synchronous mongo client or isolated loop here since Celery runs synchronously
        import pymongo
        mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        mongo_db = os.getenv("MONGODB_DB", "socialpilot")
        is_atlas = "mongodb.net" in mongo_url
        
        sync_mongo = pymongo.MongoClient(
            mongo_url,
            **({"tlsAllowInvalidCertificates": True} if is_atlas else {})
        )
        analytics_col = sync_mongo[mongo_db]["analytics"]
        
        doc = {
            "post_id": post_id,
            "user_id": post.user_id,
            "platform": post.platform,
            "platform_post_id": post.platform_post_id,
            "metrics": metrics,
            "updated_at": datetime.now(timezone.utc)
        }
        
        analytics_col.update_one(
            {"post_id": post_id},
            {"$set": doc},
            upsert=True
        )
        sync_mongo.close()

        logger.info(f"Analytics collected for post {post_id}")
        return {"post_id": post_id, "status": "analytics_collected", "metrics": metrics}
        
    except Exception as e:
        logger.error(f"Failed to collect post analytics: {str(e)}")
        raise self.retry(exc=e, countdown=60) 
    finally:
        db.close()


@shared_task(bind=True, name="tasks.analytics.collect_campaign_analytics")
def collect_campaign_analytics(self, campaign_id: int):
    """
    Aggregates analytics across all posts in a campaign using the service layer.
    """
    db = SessionLocal()
    try:
        # Call the logic from your service file
        result = aggregate_campaign_metrics(db, campaign_id)
        
        # Commit any updates made inside the service function
        db.commit()

        return {
            "campaign_id": campaign_id, 
            "metrics": {
                "total_posts": result.total_posts,
                "impressions": result.total_impressions,
                "clicks": result.total_clicks,
                "engagements": result.total_engagements
            },
            "status": "campaign_analytics_collected"
        }
        
    except Exception as e:
        db.rollback() # Rollback on error to keep database state clean
        logger.error(f"Failed to aggregate campaign analytics: {str(e)}")
        raise self.retry(exc=e, countdown=60)
    finally:
        db.close()