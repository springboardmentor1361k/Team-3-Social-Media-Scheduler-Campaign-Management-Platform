import os
import ssl
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Upstash (and any TLS Redis) uses rediss:// — Celery needs explicit SSL config
_using_tls = REDIS_URL.startswith("rediss://")

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

# Enable TLS/SSL when connecting to Upstash or any rediss:// endpoint
if _using_tls:
    ssl_config = {"ssl_cert_reqs": ssl.CERT_NONE}
    app.conf.broker_use_ssl = ssl_config
    app.conf.redis_backend_use_ssl = ssl_config

