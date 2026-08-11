"""add_campaign_posts_and_campaign_fields

Revision ID: a3f1c2d4e5b6
Revises: d186be4742b6
Create Date: 2026-07-22 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "a3f1c2d4e5b6"
down_revision: Union[str, None] = "d186be4742b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to campaigns (ignore if they already exist via raw SQL)
    op.add_column("campaigns", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("campaigns", sa.Column("objective", sa.String(150), nullable=True))

    # Create campaign_posts association table
    op.create_table(
        "campaign_posts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("campaign_id", sa.Integer(), sa.ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False),
        sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("added_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("campaign_id", "post_id", name="uq_campaign_post"),
    )
    op.create_index("idx_campaign_posts_campaign", "campaign_posts", ["campaign_id"])
    op.create_index("idx_campaign_posts_post", "campaign_posts", ["post_id"])


def downgrade() -> None:
    op.drop_index("idx_campaign_posts_post", table_name="campaign_posts")
    op.drop_index("idx_campaign_posts_campaign", table_name="campaign_posts")
    op.drop_table("campaign_posts")
    op.drop_column("campaigns", "objective")
    op.drop_column("campaigns", "description")
