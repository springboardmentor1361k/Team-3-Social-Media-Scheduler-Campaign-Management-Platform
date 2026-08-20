from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TeamMemberOut(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True

class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "from-violet-500 to-purple-600"

class TeamOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    color: str
    created_at: datetime
    # We will compute members and campaigns count manually in the response
    members: List[TeamMemberOut] = []
    postsThisMonth: int = 0
    campaigns: int = 0

    class Config:
        from_attributes = True
