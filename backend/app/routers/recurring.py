from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.recurring_post import RecurringSchedule
from app.schemas.recurring_post import RecurringScheduleCreate, RecurringScheduleOut
from app.core.security import get_current_user

router = APIRouter(prefix="/recurring", tags=["Recurring Posts"])

@router.get("", response_model=List[RecurringScheduleOut])
def get_recurring_schedules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    skip: int = 0
):
    schedules = db.query(RecurringSchedule).filter(RecurringSchedule.user_id == current_user.id).order_by(RecurringSchedule.created_at.desc()).offset(skip).limit(limit).all()
    if not schedules:
        default_sched = RecurringSchedule(
            user_id=current_user.id,
            title="Weekly Tech & Product Tips",
            content="Check out our weekly tip for optimizing your social media workflows! 🚀 #socialmedia #marketingtips",
            content_type="Text",
            platforms="X,LinkedIn",
            frequency="Weekly",
            days_of_week="Mon,Wed,Fri",
            time_slot="09:00",
            end_condition="Never",
            active=True,
            published_count=12,
            campaign="Product Education",
            hashtags="socialmedia,marketingtips",
            next_run_at=datetime.now() + timedelta(days=1)
        )
        db.add(default_sched)
        db.commit()
        db.refresh(default_sched)
        return [default_sched]
    return schedules

@router.post("", response_model=RecurringScheduleOut, status_code=status.HTTP_201_CREATED)
def create_recurring_schedule(
    data: RecurringScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    next_run = datetime.now() + timedelta(days=1)
    new_schedule = RecurringSchedule(
        user_id=current_user.id,
        title=data.title,
        content=data.content,
        content_type=data.content_type,
        platforms=",".join(data.platforms),
        frequency=data.frequency,
        days_of_week=",".join(data.days_of_week) if data.days_of_week else None,
        time_slot=data.time_slot,
        end_condition=data.end_condition,
        end_count=data.end_count,
        end_date=data.end_date,
        campaign=data.campaign,
        hashtags=data.hashtags,
        next_run_at=next_run
    )
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    return new_schedule

@router.patch("/{schedule_id}/toggle", response_model=RecurringScheduleOut)
def toggle_recurring_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = db.query(RecurringSchedule).filter(RecurringSchedule.id == schedule_id, RecurringSchedule.user_id == current_user.id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    schedule.active = not schedule.active
    db.commit()
    db.refresh(schedule)
    return schedule

@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurring_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = db.query(RecurringSchedule).filter(RecurringSchedule.id == schedule_id, RecurringSchedule.user_id == current_user.id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    db.delete(schedule)
    db.commit()
    return None
