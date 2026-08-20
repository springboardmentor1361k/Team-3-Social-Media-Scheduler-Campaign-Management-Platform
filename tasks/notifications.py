from celery import shared_task


@shared_task(bind=True, name="tasks.notifications.send_publish_notification")
def send_publish_notification(self, user_id: int, post_id: int, status: str):
    """
    Sends an email/push notification to the user about post publish status.
    status: 'published' | 'failed'
    """
    # TODO: load user email, send via SMTP or push service
    return {"user_id": user_id, "post_id": post_id, "notified": True}


@shared_task(bind=True, name="tasks.notifications.send_campaign_alert")
def send_campaign_alert(self, user_id: int, campaign_id: int, message: str):
    """
    Sends a campaign-level alert (e.g. campaign ended, budget threshold hit).
    """
    # TODO: send notification via email/push
    return {"user_id": user_id, "campaign_id": campaign_id, "notified": True}
