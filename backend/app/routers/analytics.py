from sqlalchemy.orm import Session
from app.database import get_db
from app.services.analytics_service import get_audience_growth
from fastapi import APIRouter, Depends, BackgroundTasks
from typing import Dict, Any

from app.models.user import User
from app.models.post import Post
from app.core.security import get_current_user
from app.services import mongo_analytics_service
import celery_worker  # noqa: F401 — ensures Celery app is initialised before shared_task lookup
from tasks.analytics import collect_post_analytics

router = APIRouter(prefix="/analytics", tags=["Analytics"])

def _trigger_analytics_sync(db: Session, user_id: int):
    """Dispatches celery tasks to sync analytics for recently published posts."""
    try:
        recent_posts = (
            db.query(Post)
            .filter(Post.user_id == user_id, Post.status == "published")
            .order_by(Post.published_at.desc())
            .limit(10)
            .all()
        )
        for post in recent_posts:
            if post.platform_post_id:
                collect_post_analytics.delay(post.id)
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning("Analytics sync skipped (Redis unavailable?): %s", exc)

@router.get("/dashboard")
async def get_dashboard_analytics(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    
    # 1. Trigger background sync so the NEXT load is fresher
    background_tasks.add_task(_trigger_analytics_sync, db, current_user.id)

    # 2. Pull real counts from PostgreSQL
    total_posts = db.query(Post).filter(Post.user_id == current_user.id).count()
    published_posts = db.query(Post).filter(Post.user_id == current_user.id, Post.status == "published").count()

    # 3. Instantly return current MongoDB data
    engagement = await mongo_analytics_service.get_engagement_overview(current_user.id)
    followers = await mongo_analytics_service.get_follower_distribution(current_user.id)
    platform = await mongo_analytics_service.get_platform_performance(current_user.id)
    activity = await mongo_analytics_service.get_recent_activity(current_user.id)
    top = await mongo_analytics_service.get_top_posts(current_user.id)

    total_eng = sum(item.get("engagement", 0) for item in engagement)
    total_reach = int(total_eng * 1.5)

    return {
        "stats": {
            "total_posts": {"value": str(total_posts), "trend": "+"},
            "followers": {"value": str(published_posts), "trend": "+"},
            "engagement": {"value": f"{total_eng:,}", "trend": "5%"},
            "reach": {"value": f"{total_reach:,}", "trend": "15%"},
        },
        "engagementData": engagement,
        "followerDistribution": followers,
        "platformPerformance": platform,
        "recentActivity": activity,
        "topPosts": top
    }

@router.get("/audience-growth/{account_id}")
def get_growth_metrics(
    account_id: int, 
    start_date: str, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches daily follower growth for a specific social account from PostgreSQL.
    """
    # Fetch data using the service function
    data = get_audience_growth(db, account_id, start_date)
    
    # Convert SQLAlchemy Row objects to dictionaries for the JSON response
    return {"data": [dict(row._mapping) for row in data]}


@router.get("/platform-stats")
async def get_platform_stats(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Returns per-platform engagement breakdown from MongoDB analytics,
    used by the Reports → Platform Comparison tab.
    """
    from app.mongodb import get_analytics_collection
    analytics_col = get_analytics_collection()

    pipeline = [
        {"$match": {"user_id": current_user.id}},
        {
            "$group": {
                "_id": "$platform",
                "total_impressions": {"$sum": "$metrics.impressions"},
                "total_reach": {"$sum": "$metrics.reach"},
                "total_engagements": {"$sum": "$metrics.engagements"},
                "total_clicks": {"$sum": "$metrics.clicks"},
                "post_count": {"$sum": 1},
            }
        },
        {"$sort": {"total_impressions": -1}},
    ]

    results = []
    async for doc in analytics_col.aggregate(pipeline):
        plat = str(doc["_id"]).capitalize()
        impressions = doc.get("total_impressions", 0)
        engagements = doc.get("total_engagements", 0)
        eng_rate = f"{(engagements / impressions * 100):.1f}%" if impressions > 0 else "0%"
        followers_approx = f"{impressions // 10:.0f}" if impressions > 0 else "0"
        results.append({
            "platform": plat,
            "followers": f"{int(followers_approx):,}",
            "engagement": eng_rate,
            "impressions": f"{impressions / 1000:.1f}K" if impressions >= 1000 else str(impressions),
            "clicks": doc.get("total_clicks", 0),
            "post_count": doc.get("post_count", 0),
        })

    # If no analytics data yet, return zero-valued entries for all known platforms
    if not results:
        results = [
            {"platform": p, "followers": "0", "engagement": "0%", "impressions": "0", "clicks": 0, "post_count": 0}
            for p in ["Instagram", "Facebook", "Linkedin", "Twitter", "Youtube"]
        ]

    return {"platforms": results}

