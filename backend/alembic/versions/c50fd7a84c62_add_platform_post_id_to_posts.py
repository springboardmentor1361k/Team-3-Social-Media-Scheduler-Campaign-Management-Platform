"""add platform_post_id to posts

Revision ID: c50fd7a84c62
Revises: a3f1c2d4e5b6
Create Date: 2026-08-11 16:03:25.478069

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c50fd7a84c62'
down_revision: Union[str, None] = 'a3f1c2d4e5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _index_exists(conn, index_name: str) -> bool:
    result = conn.execute(
        sa.text(
            "SELECT EXISTS (SELECT 1 FROM pg_indexes "
            "WHERE schemaname='public' AND indexname=:i)"
        ),
        {"i": index_name},
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

    # Drop the old-style idx_ indexes only if they exist
    if _index_exists(conn, 'idx_campaign_posts_campaign'):
        op.drop_index('idx_campaign_posts_campaign', table_name='campaign_posts')
    if _index_exists(conn, 'idx_campaign_posts_post'):
        op.drop_index('idx_campaign_posts_post', table_name='campaign_posts')

    # Create ix_ style indexes only if they don't already exist
    if not _index_exists(conn, 'ix_campaign_posts_campaign_id'):
        op.create_index(op.f('ix_campaign_posts_campaign_id'), 'campaign_posts', ['campaign_id'], unique=False)
    if not _index_exists(conn, 'ix_campaign_posts_id'):
        op.create_index(op.f('ix_campaign_posts_id'), 'campaign_posts', ['id'], unique=False)
    if not _index_exists(conn, 'ix_campaign_posts_post_id'):
        op.create_index(op.f('ix_campaign_posts_post_id'), 'campaign_posts', ['post_id'], unique=False)

    # Add platform_post_id column to posts if not already there
    if not _column_exists(conn, 'posts', 'platform_post_id'):
        op.add_column('posts', sa.Column('platform_post_id', sa.String(length=255), nullable=True))
    if not _index_exists(conn, 'ix_posts_platform_post_id'):
        op.create_index(op.f('ix_posts_platform_post_id'), 'posts', ['platform_post_id'], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    if _index_exists(conn, 'ix_posts_platform_post_id'):
        op.drop_index(op.f('ix_posts_platform_post_id'), table_name='posts')
    if _column_exists(conn, 'posts', 'platform_post_id'):
        op.drop_column('posts', 'platform_post_id')
    if _index_exists(conn, 'ix_campaign_posts_post_id'):
        op.drop_index(op.f('ix_campaign_posts_post_id'), table_name='campaign_posts')
    if _index_exists(conn, 'ix_campaign_posts_id'):
        op.drop_index(op.f('ix_campaign_posts_id'), table_name='campaign_posts')
    if _index_exists(conn, 'ix_campaign_posts_campaign_id'):
        op.drop_index(op.f('ix_campaign_posts_campaign_id'), table_name='campaign_posts')
    if not _index_exists(conn, 'idx_campaign_posts_post'):
        op.create_index('idx_campaign_posts_post', 'campaign_posts', ['post_id'], unique=False)
    if not _index_exists(conn, 'idx_campaign_posts_campaign'):
        op.create_index('idx_campaign_posts_campaign', 'campaign_posts', ['campaign_id'], unique=False)

