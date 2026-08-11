from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    objective: Optional[str] = None
    status: Optional[str] = "Draft"
    platforms: Optional[str] = None
    budget: Optional[str] = None
    reach: Optional[str] = None
    engagement: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    progress: Optional[int] = 0
    color: Optional[str] = "from-violet-500 to-purple-600"


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    objective: Optional[str] = None
    status: Optional[str] = None
    platforms: Optional[str] = None
    budget: Optional[str] = None
    reach: Optional[str] = None
    engagement: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    progress: Optional[int] = None
    color: Optional[str] = None


class CampaignOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    objective: Optional[str]
    status: str
    platforms: Optional[str]
    budget: Optional[str]
    reach: Optional[str]
    engagement: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    progress: int
    color: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CampaignPostAdd(BaseModel):
    post_id: int


class CampaignPostOut(BaseModel):
    id: int
    campaign_id: int
    post_id: int
    added_at: datetime

    class Config:
        from_attributes = True
