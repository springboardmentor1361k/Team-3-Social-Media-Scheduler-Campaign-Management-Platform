from fastapi import APIRouter, Depends
from typing import Dict, Any, List

from app.models.user import User
from app.core.security import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("")
async def get_reports(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    return {
        "monthly_data": [
            { "month": "Jan", "posts": 42, "reach": "82K",  "engagement": "5.4%", "revenue": "$3.2K" },
            { "month": "Feb", "posts": 38, "reach": "71K",  "engagement": "4.9%", "revenue": "$2.8K" },
            { "month": "Mar", "posts": 55, "reach": "105K", "engagement": "7.1%", "revenue": "$4.5K" },
            { "month": "Apr", "posts": 61, "reach": "128K", "engagement": "8.3%", "revenue": "$5.1K" },
            { "month": "May", "posts": 47, "reach": "94K",  "engagement": "6.5%", "revenue": "$3.9K" },
            { "month": "Jun", "posts": 73, "reach": "152K", "engagement": "9.8%", "revenue": "$6.4K" },
            { "month": "Jul", "posts": 48, "reach": "110K", "engagement": "7.6%", "revenue": "$4.8K" },
        ],
        "top_posts": [
            { "title": "Summer Sale Campaign",      "platform": "Instagram", "reach": "42K", "eng": "11.2%", "trend": "up"   },
            { "title": "New Product Launch",        "platform": "Facebook",  "reach": "36K", "eng": "8.7%",  "trend": "up"   },
            { "title": "AI Marketing Tips Thread",  "platform": "LinkedIn",  "reach": "29K", "eng": "6.3%",  "trend": "down" },
            { "title": "Behind the Scenes Reel",    "platform": "Instagram", "reach": "54K", "eng": "13.1%", "trend": "up"   },
            { "title": "Customer Success Story",    "platform": "Twitter",   "reach": "18K", "eng": "4.5%",  "trend": "down" },
        ],
        "totals": {
            "posts":      317,
            "reach":      "742K",
            "engagement": "7.2%",
            "growth":     "+24%",
        }
    }
