from typing import Any, Dict, List
from app.mongodb import get_mongo_client

# We will just return mock data directly from this service for now 
# as this represents the MongoDB layer for analytics

async def get_engagement_overview(user_id: int) -> List[Dict[str, Any]]:
    # Mock data to match frontend
    return [
        {"name": "Jan", "engagement": 2200},
        {"name": "Feb", "engagement": 3100},
        {"name": "Mar", "engagement": 2800},
        {"name": "Apr", "engagement": 4200},
        {"name": "May", "engagement": 3800},
        {"name": "Jun", "engagement": 5600},
    ]

async def get_follower_distribution(user_id: int) -> List[Dict[str, Any]]:
    return [
        {"name": "Instagram", "value": 4500, "color": "#e4405f", "pct": "45%"},
        {"name": "Facebook", "value": 3000, "color": "#1877f2", "pct": "30%"},
        {"name": "LinkedIn", "value": 1800, "color": "#0077b5", "pct": "18%"},
        {"name": "X (Twitter)", "value": 700, "color": "#ffffff", "pct": "7%"},
    ]

async def get_platform_performance(user_id: int) -> List[Dict[str, Any]]:
    return [
        {"platform": "Instagram", "pct": "45%", "desc": "Best Performing", "color": "text-[#e4405f]", "bg": "bg-[#e4405f]/15"},
        {"platform": "Facebook", "pct": "30%", "desc": "Good Reach", "color": "text-[#1877f2]", "bg": "bg-[#1877f2]/15"},
        {"platform": "LinkedIn", "pct": "18%", "desc": "Professional Audience", "color": "text-[#0077b5]", "bg": "bg-[#0077b5]/15"},
        {"platform": "X (Twitter)", "pct": "7%", "desc": "Needs Improvement", "color": "text-white/60", "bg": "bg-white/10"},
    ]

async def get_recent_activity(user_id: int) -> List[Dict[str, Any]]:
    return [
        {"platform": "Instagram", "date": "06 Jul", "likes": 120, "comments": 45, "shares": 20},
        {"platform": "Facebook", "date": "05 Jul", "likes": 95, "comments": 38, "shares": 15},
        {"platform": "LinkedIn", "date": "04 Jul", "likes": 70, "comments": 25, "shares": 12},
        {"platform": "X (Twitter)", "date": "03 Jul", "likes": 110, "comments": 50, "shares": 22},
    ]

async def get_top_posts(user_id: int) -> List[Dict[str, Any]]:
    return [
        {"post": "Summer Sale Campaign", "platform": "Instagram", "likes": 420, "comments": 88, "shares": 35},
        {"post": "New Product Launch", "platform": "Facebook", "likes": 360, "comments": 74, "shares": 28},
        {"post": "AI Marketing Tips", "platform": "LinkedIn", "likes": 295, "comments": 52, "shares": 19},
    ]
