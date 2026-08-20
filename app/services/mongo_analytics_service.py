from typing import Any, Dict, List
from app.mongodb import get_analytics_collection

async def get_engagement_overview(user_id: int) -> List[Dict[str, Any]]:
    # Aggregate engagement over the last 6 months
    # For now, we will just return a simple fallback if no data exists, 
    # but try to fetch from MongoDB first.
    col = get_analytics_collection()
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%b", "date": "$updated_at"}},
            "engagement": {"$sum": "$metrics.engagements"}
        }},
        {"$sort": {"_id": 1}}
    ]
    results = await col.aggregate(pipeline).to_list(length=6)
    
    if not results:
        return [
            {"name": "Jan", "engagement": 0},
            {"name": "Feb", "engagement": 0},
            {"name": "Mar", "engagement": 0},
            {"name": "Apr", "engagement": 0},
            {"name": "May", "engagement": 0},
            {"name": "Jun", "engagement": 0},
        ]
        
    return [{"name": r["_id"], "engagement": r["engagement"]} for r in results]

async def get_follower_distribution(user_id: int) -> List[Dict[str, Any]]:
    # Fallback to static for follower dist since it requires a different API (profile fetching)
    return [
        {"name": "Instagram", "value": 4500, "color": "#e4405f", "pct": "45%"},
        {"name": "Facebook", "value": 3000, "color": "#1877f2", "pct": "30%"},
        {"name": "LinkedIn", "value": 1800, "color": "#0077b5", "pct": "18%"},
        {"name": "X (Twitter)", "value": 700, "color": "#ffffff", "pct": "7%"},
    ]

async def get_platform_performance(user_id: int) -> List[Dict[str, Any]]:
    col = get_analytics_collection()
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": "$platform",
            "total_engagement": {"$sum": "$metrics.engagements"}
        }},
        {"$sort": {"total_engagement": -1}}
    ]
    results = await col.aggregate(pipeline).to_list(length=4)
    
    if not results:
        return [
            {"platform": "Instagram", "pct": "0%", "desc": "No data", "color": "text-[#e4405f]", "bg": "bg-[#e4405f]/15"},
            {"platform": "Facebook", "pct": "0%", "desc": "No data", "color": "text-[#1877f2]", "bg": "bg-[#1877f2]/15"},
            {"platform": "LinkedIn", "pct": "0%", "desc": "No data", "color": "text-[#0077b5]", "bg": "bg-[#0077b5]/15"},
            {"platform": "X (Twitter)", "pct": "0%", "desc": "No data", "color": "text-white/60", "bg": "bg-white/10"},
        ]
        
    total = sum(r["total_engagement"] for r in results) or 1
    
    formatted = []
    colors = {
        "instagram": ("text-[#e4405f]", "bg-[#e4405f]/15"),
        "facebook": ("text-[#1877f2]", "bg-[#1877f2]/15"),
        "linkedin": ("text-[#0077b5]", "bg-[#0077b5]/15"),
        "twitter": ("text-white/60", "bg-white/10"),
        "youtube": ("text-[#ff0000]", "bg-[#ff0000]/15"),
    }
    
    for idx, r in enumerate(results):
        plat = r["_id"].lower()
        pct = int((r["total_engagement"] / total) * 100)
        c, bg = colors.get(plat, ("text-gray-400", "bg-gray-100"))
        
        desc = "Best Performing" if idx == 0 else "Good Reach"
        
        formatted.append({
            "platform": r["_id"].capitalize(),
            "pct": f"{pct}%",
            "desc": desc,
            "color": c,
            "bg": bg
        })
    return formatted

async def get_recent_activity(user_id: int) -> List[Dict[str, Any]]:
    col = get_analytics_collection()
    results = await col.find({"user_id": user_id}).sort("updated_at", -1).limit(4).to_list(length=4)
    
    if not results:
        return []
        
    activity = []
    for r in results:
        date_str = r.get("updated_at").strftime("%d %b") if r.get("updated_at") else "Unknown"
        m = r.get("metrics", {})
        activity.append({
            "platform": str(r.get("platform", "")).capitalize(),
            "date": date_str,
            "likes": m.get("engagements", 0),  # approximation
            "comments": m.get("clicks", 0),
            "shares": 0
        })
    return activity

async def get_top_posts(user_id: int) -> List[Dict[str, Any]]:
    col = get_analytics_collection()
    results = await col.find({"user_id": user_id}).sort("metrics.engagements", -1).limit(3).to_list(length=3)
    
    if not results:
        return []
        
    top_posts = []
    for idx, r in enumerate(results):
        m = r.get("metrics", {})
        top_posts.append({
            "post": f"Post #{r.get('post_id')} - {str(r.get('platform', '')).capitalize()}",
            "platform": str(r.get("platform", "")).capitalize(),
            "likes": m.get("engagements", 0),
            "comments": m.get("clicks", 0),
            "shares": 0
        })
    return top_posts
