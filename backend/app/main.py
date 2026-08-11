import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.database import get_db, engine, Base
from app.models import user, social_account, post, scheduled_post
from app.models.campaign import Campaign, CampaignPost
from app.routers.auth import router as auth_router
from app.routers.accounts import router as accounts_router
from app.routers.users import router as users_router
from app.routers.content import router as content_router
from app.routers.media import router as media_router
from app.routers.publishing import router as publishing_router
from app.routers.oauth import router as oauth_router
from app.routers.notification import router as notification_router
from app.routers.campaigns import router as campaigns_router
from app.routers.teams import router as teams_router
from app.routers.analytics import router as analytics_router
from app.routers.reports import router as reports_router
from app.routers.recurring import router as recurring_router

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SocialPilot API",
    description="Centralized Social Media Scheduler & Campaign Management Platform",
    version="1.0.0"
)

_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
ALLOWED_ORIGINS = [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(accounts_router)
app.include_router(users_router)
app.include_router(content_router)
app.include_router(media_router)
app.include_router(publishing_router)
app.include_router(oauth_router)
app.include_router(notification_router, prefix="/api/v1")
app.include_router(campaigns_router, prefix="/api/v1")
app.include_router(teams_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(recurring_router, prefix="/api/v1")


import asyncio
import logging

logger = logging.getLogger(__name__)


from starlette.concurrency import run_in_threadpool


async def _scheduled_publishing_loop():
    """
    Background loop that checks for due scheduled posts every 25 seconds
    and triggers automated background publishing.
    """
    from tasks.publishing import check_and_publish_scheduled_posts
    while True:
        try:
            await asyncio.sleep(25)
            await run_in_threadpool(check_and_publish_scheduled_posts)
        except Exception as err:
            logger.warning("Automated publishing loop error: %s", err)


@app.on_event("startup")
async def start_background_tasks():
    asyncio.create_task(_scheduled_publishing_loop())


@app.get("/", tags=["Status"])
def root():
    return {
        "status": "online",
        "message": "SocialPilot API is running.",
        "version": "1.0.0"
    }


@app.get("/test-db", tags=["Status"])
def test_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "success", "message": "Database connected successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection failed: {str(e)}")
