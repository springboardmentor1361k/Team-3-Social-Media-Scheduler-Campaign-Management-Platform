from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.social_account import SocialAccount
from app.schemas.auth import SocialAccountCreate, SocialAccountOut
from app.core.security import get_current_user

router = APIRouter(prefix="/api/v1/accounts", tags=["Social Accounts"])


@router.post("/connect", response_model=SocialAccountOut, status_code=status.HTTP_201_CREATED)
def connect_social_account(
    account_data: SocialAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_account = SocialAccount(
        user_id=current_user.id,
        platform=account_data.platform,
        account_name=account_data.account_name,
        platform_account_id=account_data.platform_account_id,
        access_token=account_data.access_token,
        refresh_token=account_data.refresh_token,
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account


@router.get("/list", response_model=List[SocialAccountOut])
def list_connected_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(SocialAccount).filter(SocialAccount.user_id == current_user.id).all()


@router.delete("/{account_id}", status_code=status.HTTP_200_OK)
def disconnect_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = db.query(SocialAccount).filter(
        SocialAccount.id == account_id,
        SocialAccount.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    db.delete(account)
    db.commit()
    return {"success": True, "message": "Account disconnected"}


@router.post("/{account_id}/refresh", response_model=SocialAccountOut)
def refresh_account_token(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = db.query(SocialAccount).filter(
        SocialAccount.id == account_id,
        SocialAccount.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # In a real app, this would use the refresh_token to hit the platform API
    # and get a new access token. For now, we'll just mock a success.
    if account.status == "expired":
        account.status = "connected"
        db.commit()
        db.refresh(account)

    return account
