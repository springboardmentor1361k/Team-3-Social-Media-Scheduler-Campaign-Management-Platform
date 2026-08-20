"""add_all_missing_tables_and_campaign_fields

Revision ID: a3f1c2d4e5b6
Revises: d186be4742b6
Create Date: 2026-07-22 00:00:00.000000

This migration creates ALL tables that were previously only created via
Base.metadata.create_all() locally but were never in a migration:
  posts, scheduled_posts, queue, teams, team_members, notifications,
  campaigns, recurring_schedules, campaign_posts

Uses IF NOT EXISTS guards so it is safe to run on both:
  - A fresh Neon/Postgres DB (creates everything)
  - An existing local DB where some tables already exist (skips them)
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "a3f1c2d4e5b6"
down_revision: Union[str, None] = "d186be4742b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(conn, table_name: str) -> bool:
    result = conn.execute(
        sa.text(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables "
            "WHERE table_schema='public' AND table_name=:t)"
        ),
        {"t": table_name},
    )
    return result.scalar()


def _column_exists(conn, table_name: str, column_name: str) -> bool:
    result = conn.execute(
        sa.text(
            "SELECT EXISTS (SELECT 1 FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name=:t AND column_name=:c)"
        ),
        {"t": table_name, "c": column_name},
    )
    return result.scalar()


def upgrade() -> None:
    conn = op.get_bind()

    # ── posts ──────────────────────────────────────────────────────────────────
    if not _table_exists(conn, "posts"):
        op.create_table(
            "posts",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("social_account_id", sa.Integer(), sa.ForeignKey("social_accounts.id", ondelete="SET NULL"), nullable=True, index=True),
            sa.Column("content", sa.Text(), nullable=True),
            sa.Column("media_urls", postgresql.ARRAY(sa.String()), nullable=True),
            sa.Column("content_type", sa.String(30), nullable=False, server_default="text"),
            sa.Column("platform", sa.String(50), nullable=False, index=True),
            sa.Column("platform_post_id", sa.String(255), nullable=True, index=True),
            sa.Column("status", sa.String(30), nullable=False, server_default="draft", index=True),
            sa.Column("scheduled_time", sa.DateTime(timezone=True), nullable=True, index=True),
            sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

    # ── scheduled_posts ────────────────────────────────────────────────────────
    if not _table_exists(conn, "scheduled_posts"):
        op.create_table(
            "scheduled_posts",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, unique=True, index=True),
            sa.Column("scheduled_time", sa.DateTime(timezone=True), nullable=False, index=True),
            sa.Column("is_recurring", sa.Boolean(), nullable=False, server_default="false"),
            sa.Column("recurrence_rule", sa.String(100), nullable=True),
            sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("celery_task_id", sa.String(255), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

    # ── queue ──────────────────────────────────────────────────────────────────
    if not _table_exists(conn, "queue"):
        op.create_table(
            "queue",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=True, index=True),
            sa.Column("scheduled_post_id", sa.Integer(), sa.ForeignKey("scheduled_posts.id", ondelete="CASCADE"), nullable=True, index=True),
            sa.Column("social_account_id", sa.Integer(), sa.ForeignKey("social_accounts.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("queue_type", sa.String(20), nullable=False, server_default="scheduled"),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("media_url", sa.String(255), nullable=True),
            sa.Column("scheduled_time", sa.DateTime(timezone=True), nullable=False, index=True),
            sa.Column("last_attempt_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("status", sa.String(20), nullable=False, server_default="pending", index=True),
            sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("max_retries", sa.Integer(), nullable=False, server_default="3"),
            sa.Column("error_message", sa.Text(), nullable=True),
            sa.Column("platform_response", postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), index=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )

    # ── teams ──────────────────────────────────────────────────────────────────
    if not _table_exists(conn, "teams"):
        op.create_table(
            "teams",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("color", sa.String(100), nullable=False, server_default="from-violet-500 to-purple-600"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

    # ── team_members ───────────────────────────────────────────────────────────
    if not _table_exists(conn, "team_members"):
        op.create_table(
            "team_members",
            sa.Column("team_id", sa.Integer(), sa.ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
            sa.Column("role", sa.String(50), server_default="Member"),
        )

    # ── notifications ──────────────────────────────────────────────────────────
    if not _table_exists(conn, "notifications"):
        op.create_table(
            "notifications",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("title", sa.String(255), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("type", sa.String(50), nullable=False, server_default="info"),
            sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false", index=True),
            sa.Column("link", sa.String(255), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False, index=True),
        )

    # ── campaigns ──────────────────────────────────────────────────────────────
    if not _table_exists(conn, "campaigns"):
        op.create_table(
            "campaigns",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("objective", sa.String(150), nullable=True),
            sa.Column("status", sa.String(50), nullable=False, server_default="Draft"),
            sa.Column("platforms", sa.String(255), nullable=True),
            sa.Column("budget", sa.String(50), nullable=True),
            sa.Column("reach", sa.String(50), nullable=True),
            sa.Column("engagement", sa.String(50), nullable=True),
            sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
            sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
            sa.Column("progress", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("color", sa.String(100), nullable=False, server_default="from-violet-500 to-purple-600"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
    else:
        # Table already exists (local dev) — add any missing columns safely
        if not _column_exists(conn, "campaigns", "description"):
            op.add_column("campaigns", sa.Column("description", sa.Text(), nullable=True))
        if not _column_exists(conn, "campaigns", "objective"):
            op.add_column("campaigns", sa.Column("objective", sa.String(150), nullable=True))
        if not _column_exists(conn, "campaigns", "start_date"):
            op.add_column("campaigns", sa.Column("start_date", sa.DateTime(timezone=True), nullable=True))
        if not _column_exists(conn, "campaigns", "end_date"):
            op.add_column("campaigns", sa.Column("end_date", sa.DateTime(timezone=True), nullable=True))
        if not _column_exists(conn, "campaigns", "progress"):
            op.add_column("campaigns", sa.Column("progress", sa.Integer(), nullable=False, server_default="0"))

    # ── recurring_schedules ────────────────────────────────────────────────────
    if not _table_exists(conn, "recurring_schedules"):
        op.create_table(
            "recurring_schedules",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("title", sa.String(255), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("content_type", sa.String(50), server_default="Text"),
            sa.Column("platforms", sa.String(), nullable=False),
            sa.Column("frequency", sa.String(50), server_default="Weekly"),
            sa.Column("days_of_week", sa.String(), nullable=True),
            sa.Column("time_slot", sa.String(10), nullable=True),
            sa.Column("end_condition", sa.String(50), server_default="Never"),
            sa.Column("end_count", sa.Integer(), nullable=True),
            sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
            sa.Column("active", sa.Boolean(), server_default="true"),
            sa.Column("published_count", sa.Integer(), server_default="0"),
            sa.Column("campaign", sa.String(255), nullable=True),
            sa.Column("hashtags", sa.String(255), nullable=True),
            sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

    # ── campaign_posts ─────────────────────────────────────────────────────────
    if not _table_exists(conn, "campaign_posts"):
        op.create_table(
            "campaign_posts",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("campaign_id", sa.Integer(), sa.ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("added_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.UniqueConstraint("campaign_id", "post_id", name="uq_campaign_post"),
        )
        op.create_index("idx_campaign_posts_campaign", "campaign_posts", ["campaign_id"])
        op.create_index("idx_campaign_posts_post", "campaign_posts", ["post_id"])


def downgrade() -> None:
    op.drop_table("campaign_posts")
    op.drop_table("recurring_schedules")
    op.drop_table("campaigns")
    op.drop_table("notifications")
    op.drop_table("team_members")
    op.drop_table("teams")
    op.drop_table("queue")
    op.drop_table("scheduled_posts")
    op.drop_table("posts")

