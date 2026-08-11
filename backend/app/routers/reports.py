from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Dict, Any

from app.models.user import User
from app.models.post import Post
from app.core.security import get_current_user
from app.database import get_db
from app.mongodb import get_analytics_collection

router = APIRouter(prefix="/reports", tags=["Reports"])

MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]


@router.get("")
async def get_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    monthly_rows = (
        db.query(
            extract("month", Post.created_at).label("month_num"),
            extract("year", Post.created_at).label("year_num"),
            func.count(Post.id).label("posts"),
        )
        .filter(Post.user_id == current_user.id)
        .group_by("month_num", "year_num")
        .order_by("year_num", "month_num")
        .limit(12)
        .all()
    )

    analytics_col = get_analytics_collection()
    pipeline = [
        {"$match": {"user_id": current_user.id}},
        {"$group": {
            "_id": {
                "month": {"$month": "$updated_at"},
                "year": {"$year": "$updated_at"},
            },
            "total_impressions": {"$sum": "$metrics.impressions"},
            "total_engagements": {"$sum": "$metrics.engagements"},
        }},
    ]
    analytics_by_month = {}
    async for doc in analytics_col.aggregate(pipeline):
        key = (doc["_id"]["year"], doc["_id"]["month"])
        analytics_by_month[key] = doc

    monthly_data = []
    for row in monthly_rows:
        m = int(row.month_num)
        y = int(row.year_num)
        analytics = analytics_by_month.get((y, m), {})
        impressions = analytics.get("total_impressions", 0)
        engagements = analytics.get("total_engagements", 0)
        reach_k = f"{impressions / 1000:.1f}K" if impressions >= 1000 else str(impressions)
        eng_pct = f"{(engagements / impressions * 100):.1f}%" if impressions > 0 else "0%"
        revenue_usd = engagements * 0.50
        revenue_str = f"K" if revenue_usd >= 1000 else f""
        monthly_data.append({"month": MONTH_NAMES[m - 1], "posts": int(row.posts), "reach": reach_k, "engagement": eng_pct, "revenue": revenue_str})

    top_posts = []
    async for doc in analytics_col.find({"user_id": current_user.id}).sort("metrics.engagements", -1).limit(5):
        metrics = doc.get("metrics", {})
        impressions = metrics.get("impressions", 0)
        engagements = metrics.get("engagements", 0)
        platform = str(doc.get("platform", "")).capitalize()
        top_posts.append({
            "title": f"Post #{doc.get('post_id')} - {platform}",
            "platform": platform,
            "reach": f"{impressions / 1000:.1f}K" if impressions >= 1000 else str(impressions),
            "eng": f"{(engagements / impressions * 100):.1f}%" if impressions > 0 else "0%",
            "trend": "up" if engagements > 50 else "down",
        })

    if not top_posts:
        recent = (
            db.query(Post)
            .filter(Post.user_id == current_user.id, Post.status == "published")
            .order_by(Post.published_at.desc())
            .limit(5)
            .all()
        )
        for p in recent:
            top_posts.append({"title": (p.content or "")[:60] or f"Post #{p.id}", "platform": str(p.platform).capitalize(), "reach": "0", "eng": "0%", "trend": "up"})

    total_posts = db.query(func.count(Post.id)).filter(Post.user_id == current_user.id).scalar() or 0
    published_count = db.query(func.count(Post.id)).filter(Post.user_id == current_user.id, Post.status == "published").scalar() or 0
    scheduled_count = db.query(func.count(Post.id)).filter(Post.user_id == current_user.id, Post.status == "scheduled").scalar() or 0
    failed_count = db.query(func.count(Post.id)).filter(Post.user_id == current_user.id, Post.status == "failed").scalar() or 0

    agg_totals = {"impressions": 0, "engagements": 0}
    async for doc in analytics_col.aggregate([
        {"$match": {"user_id": current_user.id}},
        {"$group": {"_id": None, "impressions": {"$sum": "$metrics.impressions"}, "engagements": {"$sum": "$metrics.engagements"}}},
    ]):
        agg_totals = doc

    total_reach = agg_totals.get("impressions", 0)
    total_eng = agg_totals.get("engagements", 0)
    reach_str = f"{total_reach / 1000:.1f}K" if total_reach >= 1000 else str(total_reach)
    eng_pct_str = f"{(total_eng / total_reach * 100):.1f}%" if total_reach > 0 else "0%"

    return {
        "monthly_data": monthly_data,
        "top_posts": top_posts,
        "totals": {"posts": total_posts, "reach": reach_str, "engagement": eng_pct_str, "growth": "+0%"},
        "publishing_stats": {
            "published": published_count,
            "scheduled": scheduled_count,
            "failed": failed_count,
            "success_rate": f"{(published_count / (published_count + failed_count) * 100):.0f}%" if (published_count + failed_count) > 0 else "100%",
        },
    }
