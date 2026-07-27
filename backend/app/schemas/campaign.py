from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CampaignCreate(BaseModel):
    name: str
    status: Optional[str] = "Draft"
    platforms: Optional[str] = None
    budget: Optional[str] = None
    reach: Optional[str] = None
    engagement: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    progress: Optional[int] = 0
    color: Optional[str] = "from-violet-500 to-purple-600"

class CampaignOut(BaseModel):
    id: int
    name: str
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
