# app/services/analytics_service.py

from sqlalchemy.orm import Session
from sqlalchemy import text

def get_audience_growth(db: Session, account_id: int, start_date: str):
    """
    Fetches daily follower growth for a specific social account.
    """
    query = text("""
        WITH DailyFollowers AS (
            SELECT 
                social_account_id,
                date_trunc('day', date) as report_date,
                MAX(total_followers) as followers
            FROM audience_metrics
            WHERE social_account_id = :account_id
              AND date >= :start_date
            GROUP BY social_account_id, report_date
        )
        SELECT 
            report_date,
            followers,
            followers - LAG(followers, 1) OVER (ORDER BY report_date) as daily_growth
        FROM DailyFollowers
        ORDER BY report_date DESC;
    """)
    
    result = db.execute(query, {"account_id": account_id, "start_date": start_date}).fetchall()
    return result


def aggregate_campaign_metrics(db: Session, campaign_id: int):
    """
    Executes the SQL to aggregate analytics and calculate ROI for a campaign.
    """
    query = text("""
        SELECT 
            c.budget,
            COUNT(p.id) as total_posts,
            COALESCE(SUM(pa.impressions), 0) as total_impressions,
            COALESCE(SUM(pa.clicks), 0) as total_clicks,
            COALESCE(SUM(pa.likes + pa.shares), 0) as total_engagements,
            -- Example ROI calculation (assuming each click is worth a set value, e.g., $0.50)
            -- Replace with actual revenue column if you have one in post_analytics
            CASE 
                WHEN c.budget > 0 THEN 
                    ((COALESCE(SUM(pa.clicks), 0) * 0.50) - c.budget) / c.budget * 100
                ELSE 0 
            END as roi_percentage
        FROM campaigns c
        LEFT JOIN posts p ON c.id = p.campaign_id
        LEFT JOIN post_analytics pa ON p.id = pa.post_id
        WHERE c.id = :campaign_id
        GROUP BY c.id
    """)
    
    result = db.execute(query, {"campaign_id": campaign_id}).fetchone()
    return result