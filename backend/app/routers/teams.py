from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.team import Team, team_members
from app.schemas.team import TeamCreate, TeamOut
from app.core.security import get_current_user

router = APIRouter(prefix="/teams", tags=["Teams"])

@router.get("", response_model=List[TeamOut])
def get_teams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    skip: int = 0
):
    # Get teams where the current user is a member
    teams = db.query(Team).join(team_members).filter(team_members.c.user_id == current_user.id).offset(skip).limit(limit).all()
    if not teams:
        default_team = Team(name="Core Marketing Team", description="Main team managing social media channels & content campaigns", color="from-violet-500 to-indigo-600")
        default_team.users.append(current_user)
        db.add(default_team)
        db.commit()
        db.refresh(default_team)
        teams = [default_team]

    result = []
    for team in teams:
        team_dict = {
            "id": team.id,
            "name": team.name,
            "description": team.description,
            "color": team.color,
            "created_at": team.created_at,
            "members": [{"id": u.id, "name": u.name, "email": u.email, "role": "Owner" if u.id == current_user.id else "Member"} for u in team.users],
            "postsThisMonth": 14,
            "campaigns": 3
        }
        result.append(team_dict)
    return result

@router.post("", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
def create_team(
    data: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_team = Team(
        name=data.name,
        description=data.description,
        color=data.color
    )
    # Automatically add creator as a member
    new_team.users.append(current_user)
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    
    return {
        "id": new_team.id,
        "name": new_team.name,
        "description": new_team.description,
        "color": new_team.color,
        "created_at": new_team.created_at,
        "members": [{"id": u.id, "name": u.name, "email": u.email, "role": "Owner"} for u in new_team.users],
        "postsThisMonth": 0,
        "campaigns": 0
    }
