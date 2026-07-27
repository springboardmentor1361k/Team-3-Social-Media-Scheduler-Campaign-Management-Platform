import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

app = Celery(
    "socialpilot",
    broker=f"{REDIS_URL}/0",
    backend=f"{REDIS_URL}/1",
    include=[
        "tasks.publishing",
        "tasks.analytics",
        "tasks.notifications",
    ],
)

app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    result_expires=3600,
    beat_schedule={
        "check-scheduled-posts": {
            "task": "tasks.publishing.check_and_publish_scheduled_posts",
            "schedule": 60.0,  # runs every 60 seconds
        },
    },
)
