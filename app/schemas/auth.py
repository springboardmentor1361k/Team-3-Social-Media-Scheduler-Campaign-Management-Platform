from pydantic import BaseModel, EmailStr
from typing import Optional


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "content_creator"


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Social Account Schemas
class SocialAccountBase(BaseModel):
    platform: str
    account_name: str
    platform_account_id: str
    access_token: str
    refresh_token: Optional[str] = None


class SocialAccountCreate(SocialAccountBase):
    pass


class SocialAccountOut(SocialAccountBase):
    id: int
    user_id: int
    status: str

    class Config:
        from_attributes = True