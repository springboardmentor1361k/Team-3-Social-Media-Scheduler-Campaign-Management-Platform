from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RecurringScheduleCreate(BaseModel):
    title: str
    content: str
    content_type: Optional[str] = "Text"
    platforms: List[str]
    frequency: Optional[str] = "Weekly"
    days_of_week: Optional[List[str]] = []
    time_slot: Optional[str] = None
    end_condition: Optional[str] = "Never"
    end_count: Optional[int] = None
    end_date: Optional[datetime] = None
    campaign: Optional[str] = None
    hashtags: Optional[str] = None

class RecurringScheduleOut(BaseModel):
    id: int
    title: str
    content: str
    content_type: str
    platforms: str
    frequency: str
    days_of_week: Optional[str]
    time_slot: Optional[str]
    end_condition: str
    end_count: Optional[int]
    end_date: Optional[datetime]
    active: bool
    published_count: int
    campaign: Optional[str]
    hashtags: Optional[str]
    next_run_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
