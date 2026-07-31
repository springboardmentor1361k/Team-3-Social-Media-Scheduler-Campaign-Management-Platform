# tasks/analytics.py

from celery import shared_task
import logging

# Import SessionLocal from your database.py file
from app.database import SessionLocal
# Import the service logic
from app.services.analytics_service import aggregate_campaign_metrics

logger = logging.getLogger(__name__)

@shared_task(bind=True, name="tasks.analytics.collect_post_analytics", max_retries=3)
def collect_post_analytics(self, post_id: int):
    """
    Fetches metrics from the platform API and stores them in the analytics table.
    """
    db = SessionLocal()
    try:
        # TODO: call platform API and upsert row
        logger.info(f"Analytics collected for post {post_id}")
        return {"post_id": post_id, "status": "analytics_collected"}
        
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