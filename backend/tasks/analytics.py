from celery import shared_task


@shared_task(bind=True, name="tasks.analytics.collect_post_analytics")
def collect_post_analytics(self, post_id: int):
    """
    Fetches likes, comments, shares, impressions, reach, clicks
    from the platform API and stores them in the analytics table.
    """
    # TODO: call platform API, upsert analytics row for post_id
    return {"post_id": post_id, "status": "analytics_collected"}


@shared_task(bind=True, name="tasks.analytics.collect_campaign_analytics")
def collect_campaign_analytics(self, campaign_id: int):
    """
    Aggregates analytics across all posts in a campaign.
    """
    # TODO: aggregate per-post analytics into campaign-level metrics
    return {"campaign_id": campaign_id, "status": "campaign_analytics_collected"}
