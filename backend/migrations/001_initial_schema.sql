-- =============================================================
-- SocialPilot: Initial Schema Migration
-- File    : 001_initial_schema.sql
-- DB      : PostgreSQL
-- Tables  : 13
-- =============================================================

-- Enable UUID extension (optional, using SERIAL PKs here)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- 1. users
-- =============================================================
CREATE TABLE users (
    id              SERIAL          PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   TEXT            NOT NULL,
    role            VARCHAR(50)     NOT NULL DEFAULT 'content_creator'
                                    CHECK (role IN ('admin', 'content_creator', 'marketing_team', 'business_user')),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 2. teams
-- =============================================================
CREATE TABLE teams (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    owner_id    INT             NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_teams_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
);

-- =============================================================
-- 3. team_members
-- =============================================================
CREATE TABLE team_members (
    id          SERIAL      PRIMARY KEY,
    team_id     INT         NOT NULL,
    user_id     INT         NOT NULL,
    role        VARCHAR(50) NOT NULL DEFAULT 'viewer'
                            CHECK (role IN ('viewer', 'editor', 'manager')),
    joined_at   TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
    CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_team_members      UNIQUE (team_id, user_id)
);

-- =============================================================
-- 4. social_accounts
-- =============================================================
CREATE TABLE social_accounts (
    id                  SERIAL          PRIMARY KEY,
    user_id             INT             NOT NULL,
    platform            VARCHAR(50)     NOT NULL
                                        CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'pinterest')),
    account_name        VARCHAR(150)    NOT NULL,
    platform_user_id    VARCHAR(150)    NOT NULL,
    access_token        TEXT            NOT NULL,
    refresh_token       TEXT,
    token_expires_at    TIMESTAMP,
    status              VARCHAR(30)     NOT NULL DEFAULT 'connected'
                                        CHECK (status IN ('connected', 'expired', 'revoked')),
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_social_accounts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_social_account       UNIQUE (user_id, platform, platform_user_id)
);

-- =============================================================
-- 5. posts
-- =============================================================
CREATE TABLE posts (
    id                  SERIAL          PRIMARY KEY,
    user_id             INT             NOT NULL,
    social_account_id   INT             NOT NULL,
    content             TEXT,
    media_urls          TEXT[],
    content_type        VARCHAR(30)     NOT NULL DEFAULT 'text'
                                        CHECK (content_type IN ('text', 'image', 'video', 'carousel', 'story', 'reel')),
    platform            VARCHAR(50)     NOT NULL
                                        CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'pinterest')),
    status              VARCHAR(30)     NOT NULL DEFAULT 'draft'
                                        CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'cancelled', 'pending_approval')),
    scheduled_time      TIMESTAMP,
    published_at        TIMESTAMP,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_posts_user           FOREIGN KEY (user_id)           REFERENCES users (id)           ON DELETE CASCADE,
    CONSTRAINT fk_posts_social_account FOREIGN KEY (social_account_id) REFERENCES social_accounts (id) ON DELETE RESTRICT
);

-- =============================================================
-- 6. scheduled_posts
-- =============================================================
CREATE TABLE scheduled_posts (
    id              SERIAL          PRIMARY KEY,
    post_id         INT             NOT NULL UNIQUE,
    scheduled_time  TIMESTAMP       NOT NULL,
    is_recurring    BOOLEAN         NOT NULL DEFAULT FALSE,
    recurrence_rule VARCHAR(100),
    next_run_at     TIMESTAMP,
    celery_task_id  VARCHAR(255),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_scheduled_posts_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);

-- =============================================================
-- 7. campaigns
-- =============================================================
CREATE TABLE campaigns (
    id          SERIAL          PRIMARY KEY,
    user_id     INT             NOT NULL,
    name        VARCHAR(150)    NOT NULL,
    description TEXT,
    platform    VARCHAR(50),
    start_date  DATE            NOT NULL,
    end_date    DATE            NOT NULL,
    budget      NUMERIC(12, 2),
    objective   VARCHAR(150),
    status      VARCHAR(30)     NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_campaigns_user    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_campaign_dates   CHECK (end_date >= start_date)
);

-- =============================================================
-- 8. campaign_posts
-- =============================================================
CREATE TABLE campaign_posts (
    id          SERIAL      PRIMARY KEY,
    campaign_id INT         NOT NULL,
    post_id     INT         NOT NULL,
    added_at    TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_campaign_posts_campaign   FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE,
    CONSTRAINT fk_campaign_posts_post       FOREIGN KEY (post_id)     REFERENCES posts (id)     ON DELETE CASCADE,
    CONSTRAINT uq_campaign_post             UNIQUE (campaign_id, post_id)
);

-- =============================================================
-- 9. publishing_logs
-- =============================================================
CREATE TABLE publishing_logs (
    id                  SERIAL      PRIMARY KEY,
    post_id             INT         NOT NULL,
    attempt_number      INT         NOT NULL DEFAULT 1,
    status              VARCHAR(30) NOT NULL
                                    CHECK (status IN ('success', 'failed', 'retrying')),
    platform_response   TEXT,
    error_message       TEXT,
    attempted_at        TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_publishing_logs_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);

-- =============================================================
-- 10. analytics
-- =============================================================
CREATE TABLE analytics (
    id          SERIAL      PRIMARY KEY,
    post_id     INT         NOT NULL,
    likes       INT         NOT NULL DEFAULT 0,
    comments    INT         NOT NULL DEFAULT 0,
    shares      INT         NOT NULL DEFAULT 0,
    impressions INT         NOT NULL DEFAULT 0,
    reach       INT         NOT NULL DEFAULT 0,
    clicks      INT         NOT NULL DEFAULT 0,
    saves       INT         NOT NULL DEFAULT 0,
    video_views INT         NOT NULL DEFAULT 0,
    recorded_at TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_analytics_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);

-- =============================================================
-- 11. campaign_analytics
-- =============================================================
CREATE TABLE campaign_analytics (
    id                  SERIAL          PRIMARY KEY,
    campaign_id         INT             NOT NULL,
    total_impressions   INT             NOT NULL DEFAULT 0,
    total_reach         INT             NOT NULL DEFAULT 0,
    total_engagement    INT             NOT NULL DEFAULT 0,
    total_clicks        INT             NOT NULL DEFAULT 0,
    follower_growth     INT             NOT NULL DEFAULT 0,
    roi                 NUMERIC(10, 2),
    recorded_at         TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_campaign_analytics_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE
);

-- =============================================================
-- 12. notifications
-- =============================================================
CREATE TABLE notifications (
    id          SERIAL          PRIMARY KEY,
    user_id     INT             NOT NULL,
    type        VARCHAR(50)     NOT NULL
                                CHECK (type IN ('publish_success', 'publish_failed', 'campaign_alert', 'account_update', 'reminder')),
    title       VARCHAR(150)    NOT NULL,
    message     TEXT            NOT NULL,
    is_read     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- =============================================================
-- 13. reports
-- =============================================================
CREATE TABLE reports (
    id              SERIAL      PRIMARY KEY,
    user_id         INT         NOT NULL,
    campaign_id     INT,
    report_type     VARCHAR(50) NOT NULL
                                CHECK (report_type IN ('engagement', 'campaign', 'audience', 'publishing', 'platform_comparison')),
    format          VARCHAR(10) NOT NULL
                                CHECK (format IN ('pdf', 'excel')),
    file_url        TEXT        NOT NULL,
    generated_at    TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_reports_user      FOREIGN KEY (user_id)     REFERENCES users (id)     ON DELETE CASCADE,
    CONSTRAINT fk_reports_campaign  FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE SET NULL
);

-- =============================================================
-- INDEXES
-- =============================================================

-- users
CREATE INDEX idx_users_email       ON users (email);
CREATE INDEX idx_users_role        ON users (role);

-- social_accounts
CREATE INDEX idx_social_accounts_user     ON social_accounts (user_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts (platform);

-- posts
CREATE INDEX idx_posts_user           ON posts (user_id);
CREATE INDEX idx_posts_status         ON posts (status);
CREATE INDEX idx_posts_scheduled_time ON posts (scheduled_time);
CREATE INDEX idx_posts_platform       ON posts (platform);

-- scheduled_posts
CREATE INDEX idx_scheduled_posts_time ON scheduled_posts (scheduled_time);

-- campaigns
CREATE INDEX idx_campaigns_user   ON campaigns (user_id);
CREATE INDEX idx_campaigns_status ON campaigns (status);

-- publishing_logs
CREATE INDEX idx_publishing_logs_post   ON publishing_logs (post_id);
CREATE INDEX idx_publishing_logs_status ON publishing_logs (status);

-- analytics
CREATE INDEX idx_analytics_post        ON analytics (post_id);
CREATE INDEX idx_analytics_recorded_at ON analytics (recorded_at);

-- campaign_analytics
CREATE INDEX idx_campaign_analytics_campaign ON campaign_analytics (campaign_id);

-- notifications
CREATE INDEX idx_notifications_user    ON notifications (user_id);
CREATE INDEX idx_notifications_is_read ON notifications (is_read);

-- reports
CREATE INDEX idx_reports_user     ON reports (user_id);
CREATE INDEX idx_reports_campaign ON reports (campaign_id);
