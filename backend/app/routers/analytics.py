from fastapi import APIRouter, Depends
from typing import Dict, Any

from app.models.user import User
from app.core.security import get_current_user
from app.services import mongo_analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
async def get_dashboard_analytics(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    engagement = await mongo_analytics_service.get_engagement_overview(current_user.id)
    followers = await mongo_analytics_service.get_follower_distribution(current_user.id)
    platform = await mongo_analytics_service.get_platform_performance(current_user.id)
    activity = await mongo_analytics_service.get_recent_activity(current_user.id)
    top = await mongo_analytics_service.get_top_posts(current_user.id)
    
    return {
        "stats": {
            "total_posts": {"value": "120", "trend": "12%"},
            "followers": {"value": "8.2K", "trend": "8%"},
            "engagement": {"value": "75%", "trend": "5%"},
            "reach": {"value": "18K", "trend": "15%"},
        },
        "engagementData": engagement,
        "followerDistribution": followers,
        "platformPerformance": platform,
        "recentActivity": activity,
        "topPosts": top
    }
