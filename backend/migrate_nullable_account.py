"""
One-time migration: make posts.social_account_id nullable
and update FK to SET NULL on delete.
"""
import sqlalchemy as sa
from app.database import engine

with engine.connect() as conn:
    conn.execute(sa.text("ALTER TABLE posts ALTER COLUMN social_account_id DROP NOT NULL"))
    conn.execute(sa.text("ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_social_account_id_fkey"))
    conn.execute(sa.text(
        "ALTER TABLE posts ADD CONSTRAINT posts_social_account_id_fkey "
        "FOREIGN KEY (social_account_id) REFERENCES social_accounts(id) ON DELETE SET NULL"
    ))
    conn.commit()
print("Migration complete: social_account_id is now nullable.")
