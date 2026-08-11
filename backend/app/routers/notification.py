from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationOut, NotificationUpdate
from app.core.security import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationOut])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    skip: int = 0
):
    notifications = db.query(Notification)\
        .filter(Notification.user_id == current_user.id)\
        .order_by(Notification.created_at.desc())\
        .offset(skip).limit(limit).all()

    if not notifications:
        defaults = [
            Notification(
                user_id=current_user.id,
                title="Welcome to SocialPilot",
                type="info",
                message="Welcome to SocialPilot! Your dashboard is fully initialized and ready for multi-channel publishing.",
                is_read=False,
            ),
            Notification(
                user_id=current_user.id,
                title="Publishing Engine Active",
                type="success",
                message="Automated publishing engine is active and monitoring scheduled posts.",
                is_read=False,
            ),
            Notification(
                user_id=current_user.id,
                title="Account Setup Required",
                type="warning",
                message="Connect your social accounts in the Accounts tab to start automated publishing.",
                is_read=False,
            ),
        ]
        db.add_all(defaults)
        db.commit()
        for n in defaults:
            db.refresh(n)
        return defaults

    return notifications

@router.patch("/{notification_id}", response_model=NotificationOut)
def update_notification(
    notification_id: int,
    data: NotificationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    notification.is_read = data.is_read
    db.commit()
    db.refresh(notification)
    return notification

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(notification)
    db.commit()
    return None
