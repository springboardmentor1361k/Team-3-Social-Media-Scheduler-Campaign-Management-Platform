from app.services.analytics_service import aggregate_campaign_metrics
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.campaign import Campaign
from app.schemas.campaign import CampaignCreate, CampaignOut
from app.core.security import get_current_user

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])

@router.get("", response_model=List[CampaignOut])
def get_campaigns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    skip: int = 0
):
    campaigns = db.query(Campaign).filter(Campaign.user_id == current_user.id).order_by(Campaign.created_at.desc()).offset(skip).limit(limit).all()
    if not campaigns:
        defaults = [
            Campaign(user_id=current_user.id, name="Summer Product Launch", status="Active", platforms="Instagram, Facebook, X", budget="$1,500", reach="45.2K", engagement="8.4%", progress=65, color="from-violet-500 to-purple-600"),
            Campaign(user_id=current_user.id, name="Brand Awareness Q3", status="Active", platforms="LinkedIn, YouTube", budget="$2,000", reach="82.1K", engagement="12.1%", progress=40, color="from-blue-500 to-indigo-600"),
            Campaign(user_id=current_user.id, name="Holiday Promo Prep", status="Draft", platforms="All Platforms", budget="$800", reach="0", engagement="0%", progress=10, color="from-amber-500 to-orange-600"),
        ]
        db.add_all(defaults)
        db.commit()
        for c in defaults:
            db.refresh(c)
        return defaults
    return campaigns

@router.post("", response_model=CampaignOut, status_code=status.HTTP_201_CREATED)
def create_campaign(
    data: CampaignCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_campaign = Campaign(
        user_id=current_user.id,
        name=data.name,
        status=data.status,
        platforms=data.platforms,
        budget=data.budget,
        reach=data.reach,
        engagement=data.engagement,
        start_date=data.start_date,
        end_date=data.end_date,
        progress=data.progress,
        color=data.color
    )
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    return new_campaign

@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    db.delete(campaign)
    db.commit()
    return None

@router.get("/{campaign_id}/metrics", tags=["Analytics"])
def get_campaign_metrics(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches aggregated performance metrics for a specific campaign.
    """
    # Verify the campaign belongs to the user first
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Fetch the metrics using the service layer
    metrics_data = aggregate_campaign_metrics(db, campaign_id)
    
    if not metrics_data:
        return {"data": {}}
        
    return {"data": dict(metrics_data._mapping)}
