from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.campaign import Campaign, CampaignPost
from app.models.post import Post
from app.schemas.campaign import CampaignCreate, CampaignUpdate, CampaignOut, CampaignPostAdd, CampaignPostOut
from app.core.security import get_current_user
from app.services.analytics_service import aggregate_campaign_metrics

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_campaign_or_404(campaign_id: int, user_id: int, db: Session) -> Campaign:
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id, Campaign.user_id == user_id
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


# ── Campaign CRUD ─────────────────────────────────────────────────────────────

@router.get("", response_model=List[CampaignOut])
def list_campaigns(
    skip: int = 0,
    limit: int = 50,
    status: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Campaign).filter(Campaign.user_id == current_user.id)
    if status:
        query = query.filter(Campaign.status == status)
    campaigns = query.order_by(Campaign.created_at.desc()).offset(skip).limit(limit).all()

    if not campaigns and not status:
        defaults = [
            Campaign(user_id=current_user.id, name="Summer Product Launch", status="Active",
                     platforms="Instagram, Facebook, X", budget="$1,500", reach="45.2K",
                     engagement="8.4%", progress=65, color="from-violet-500 to-purple-600"),
            Campaign(user_id=current_user.id, name="Brand Awareness Q3", status="Active",
                     platforms="LinkedIn, YouTube", budget="$2,000", reach="82.1K",
                     engagement="12.1%", progress=40, color="from-blue-500 to-indigo-600"),
            Campaign(user_id=current_user.id, name="Holiday Promo Prep", status="Draft",
                     platforms="All Platforms", budget="$800", reach="0",
                     engagement="0%", progress=10, color="from-amber-500 to-orange-600"),
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
    db: Session = Depends(get_db),
):
    campaign = Campaign(user_id=current_user.id, **data.model_dump())
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("/{campaign_id}", response_model=CampaignOut)
def get_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_campaign_or_404(campaign_id, current_user.id, db)


@router.patch("/{campaign_id}", response_model=CampaignOut)
def update_campaign(
    campaign_id: int,
    data: CampaignUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = _get_campaign_or_404(campaign_id, current_user.id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(campaign, field, value)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = _get_campaign_or_404(campaign_id, current_user.id, db)
    db.delete(campaign)
    db.commit()


# ── Campaign ↔ Post Association ───────────────────────────────────────────────

@router.get("/{campaign_id}/posts", response_model=List[CampaignPostOut])
def list_campaign_posts(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_campaign_or_404(campaign_id, current_user.id, db)
    return db.query(CampaignPost).filter(CampaignPost.campaign_id == campaign_id).all()


@router.post("/{campaign_id}/posts", response_model=CampaignPostOut, status_code=status.HTTP_201_CREATED)
def add_post_to_campaign(
    campaign_id: int,
    data: CampaignPostAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_campaign_or_404(campaign_id, current_user.id, db)

    post = db.query(Post).filter(Post.id == data.post_id, Post.user_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing = db.query(CampaignPost).filter(
        CampaignPost.campaign_id == campaign_id, CampaignPost.post_id == data.post_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Post already in campaign")

    link = CampaignPost(campaign_id=campaign_id, post_id=data.post_id)
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.delete("/{campaign_id}/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_post_from_campaign(
    campaign_id: int,
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_campaign_or_404(campaign_id, current_user.id, db)
    link = db.query(CampaignPost).filter(
        CampaignPost.campaign_id == campaign_id, CampaignPost.post_id == post_id
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Post not linked to this campaign")
    db.delete(link)
    db.commit()


# ── Campaign Metrics ──────────────────────────────────────────────────────────

@router.get("/{campaign_id}/metrics", tags=["Analytics"])
def get_campaign_metrics(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_campaign_or_404(campaign_id, current_user.id, db)
    metrics = aggregate_campaign_metrics(db, campaign_id)
    return {"data": dict(metrics._mapping) if metrics else {}}
