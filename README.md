# SocialPilot

🚀 **Live Demo:** [https://social-pilot-nine.vercel.app/home](https://social-pilot-nine.vercel.app/home)

A centralized social media scheduler and campaign management platform for content creators, marketing teams, and businesses.

---

## What It Does

- Connect Facebook, Instagram, LinkedIn, X/Twitter, YouTube, and Pinterest accounts via OAuth
- Create, draft, and schedule posts across multiple social platforms with automatic platform name normalization (`X` ↔ `twitter`)
- **Upload images, videos, carousels, stories, and reels directly to AWS S3** — media is stored in the cloud and linked to every post
- Auto-publish posts via background Celery workers or FastAPI `BackgroundTasks` fallback with automatic retry logic
- In-process background publishing loop (`_scheduled_publishing_loop`) for seamless local execution without requiring Redis
- Token encryption at rest — OAuth credentials never stored as plain text
- Interactive Calendar View for scheduling, drag-and-drop rescheduling, and status management
- Rich Drafts Management Grid backed by PostgreSQL and MongoDB document storage
- Real-time Publishing Logs with KPI metrics, media thumbnails, error trace inspection drawer, and manual retry options
- Deleting a post automatically removes its S3 media objects (no orphaned files)
- Manage marketing campaigns (with start/end dates, objectives, budgets) and link posts to campaigns
- **AI Post Assistant** powered by Google Gemini — generate, rewrite, fix grammar, shorten, or add CTAs with tone selection (Viral, Professional, Witty, Educational, Promotional)
- View engagement, audience, campaign ROI, publishing history, and per-platform analytics — all from real PostgreSQL + MongoDB data
- **Export reports as styled PDF or Excel/CSV** — custom campaign reports, engagement breakdowns, and multi-platform comparison matrices
- Per-platform analytics endpoint (`/platform-stats`) aggregates impressions, engagement rate, and post count from MongoDB
- Recurring post schedules with configurable repeat intervals
- Role-based access control enforced from JWT — Administrators, Marketing Teams, Content Creators, Business Users

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI |
| Task Queue | Celery 5.4, Redis |
| Primary DB | PostgreSQL 18 |
| Analytics DB | MongoDB Atlas 8.0 |
| Cache / Broker | Redis |
| Auth | JWT (python-jose) + bcrypt |
| ORM | SQLAlchemy 2.0 + Alembic |
| Object Storage | **AWS S3** (boto3) — media upload, CDN delivery, lifecycle management |
| Social APIs | Facebook Graph API v19, Instagram Graph API, LinkedIn API v2, Twitter/X v2 (Tweepy), YouTube Data API v3 |
| Token Security | Fernet symmetric encryption (cryptography) |
| Frontend | Next.js 16 + Tailwind CSS + TypeScript |
| Bundler | Turbopack (dev) |
| Deployment | Docker, Docker Compose, AWS/Azure |

---

## Project Structure

```
SocialPilotv2/
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   │   ├── 9840678fc460_initial_schema.py                          # Migration: users + social_accounts
│   │   │   ├── d186be4742b6_add_posts_scheduled_posts_queue.py          # Migration: posts + scheduled_posts + queue
│   │   │   └── a3f1c2d4e5b6_add_campaign_posts_and_campaign_fields.py   # Migration: campaign_posts table + description/objective columns
│   │   └── env.py                               # Alembic config — reads DATABASE_URL from .env
│   ├── app/
│   │   ├── core/
│   │   │   ├── security.py          # JWT + bcrypt + get_current_user dependency
│   │   │   └── encryption.py        # Fernet token encryption/decryption for stored OAuth tokens
│   │   ├── models/
│   │   │   ├── user.py              # User model + UserRole enum
│   │   │   ├── social_account.py    # SocialAccount model (stores encrypted tokens)
│   │   │   ├── post.py              # Post model (content, platform, status, media_urls)
│   │   │   ├── scheduled_post.py    # ScheduledPost model (recurrence, celery_task_id)
│   │   │   ├── queue.py             # Queue model (publish queue with retry tracking)
│   │   │   ├── notification.py      # Notification model
│   │   │   ├── team.py              # Team and TeamMember model
│   │   │   ├── campaign.py          # Campaign + CampaignPost models (post association)
│   │   │   └── recurring_post.py    # RecurringSchedule model
│   │   ├── platform_clients/        # ← NEW: Social Media API clients
│   │   │   ├── base.py              # PostPayload + PublishResult dataclasses, abstract base
│   │   │   ├── facebook.py          # Facebook Graph API v19 (feed, photo, video)
│   │   │   ├── instagram.py         # Instagram Graph API (container→publish, carousel, reels, stories)
│   │   │   ├── linkedin.py          # LinkedIn REST API v2 (UGC posts, image/video upload)
│   │   │   ├── twitter_x.py         # Tweepy — X/Twitter v2 create_tweet + v1.1 media upload
│   │   │   ├── youtube.py           # YouTube Data API v3 (resumable video upload, community posts)
│   │   │   └── dispatcher.py        # Maps platform name → client, calls publish()
│   │   ├── routers/
│   │   │   ├── auth.py              # /auth/register + /auth/login
│   │   │   ├── accounts.py          # /api/v1/accounts/connect + /list
│   │   │   ├── users.py             # /api/v1/users/me + /list + /me/password
│   │   │   ├── content.py           # /api/v1/content/* — post CRUD + drafts + media (S3 cleanup on delete)
│   │   │   ├── media.py             # /api/v1/media/upload + /delete  ← NEW (S3 upload router)
│   │   │   ├── publishing.py        # /api/v1/publish/{post_id} + /status/{task_id}
│   │   │   ├── oauth.py             # /api/v1/oauth/{platform}/authorize + /callback
│   │   │   ├── notification.py      # /api/v1/notifications
│   │   │   ├── campaigns.py         # /api/v1/campaigns — full CRUD + post association + metrics
│   │   │   ├── teams.py             # /api/v1/teams
│   │   │   ├── analytics.py         # /api/v1/analytics
│   │   │   ├── reports.py           # /api/v1/reports
│   │   │   └── recurring.py         # /api/v1/recurring
│   │   ├── schemas/
│   │   │   ├── auth.py              # Pydantic schemas (User + SocialAccount)
│   │   │   ├── content.py           # Pydantic schemas (Post + Draft + Media)
│   │   │   ├── campaign.py          # Pydantic schemas (CampaignCreate + CampaignUpdate + CampaignOut + CampaignPostOut)
│   │   │   ├── team.py              # Pydantic schemas (Team)
│   │   │   ├── notification.py      # Pydantic schemas (Notification)
│   │   │   └── recurring_post.py    # Pydantic schemas (RecurringSchedule)
│   │   ├── services/
│   │   │   ├── content_service.py       # PostgreSQL CRUD for Post entity
│   │   │   ├── mongo_content_service.py # Async MongoDB ops (drafts + media metadata)
│   │   │   └── s3_service.py            # AWS S3 upload + batch delete helpers  ← NEW
│   │   ├── database.py              # PostgreSQL engine + session + Base
│   │   ├── mongodb.py               # MongoDB Atlas client + collections
│   │   └── main.py                  # FastAPI app entry point + CORS from env
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # Full PostgreSQL schema (13 tables)
│   ├── tasks/
│   │   ├── publishing.py            # Beat checker + publish_post (full platform dispatch)  ← UPDATED
│   │   ├── analytics.py             # Collect post/campaign metrics
│   │   └── notifications.py         # Email/push alerts
│   ├── tests/                       # ← NEW: Unit test stubs
│   │   ├── conftest.py              # Pytest fixtures (env vars)
│   │   └── test_platform_clients.py # Mocked tests for clients, dispatcher, encryption
│   ├── celery_worker.py             # Celery app config + beat schedule
│   ├── celery_app_config.py         # Alternate config copy (kept for reference)
│   ├── alembic.ini                  # Alembic configuration
│   ├── requirements.txt
│   ├── .env                         # Local environment variables (gitignored)
│   └── .env.example                 # Template — copy to .env to get started
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx       # Login — wired to /auth/login
│   │   │   └── register/page.tsx    # Register — wired to /auth/register
│   │   └── (dashboard)/
│   │       ├── accounts/page.tsx    # Social accounts — wired to API
│   │       ├── analytics/page.tsx
│   │       ├── calendar/page.tsx
│   │       ├── campaigns/page.tsx
│   │       ├── create/page.tsx
│   │       ├── dashboard/page.tsx
│   │       ├── notifications/page.tsx
│   │       ├── profile/page.tsx
│   │       ├── reports/page.tsx
│   │       ├── teams/page.tsx
│   │       └── users/page.tsx
│   ├── components/
│   │   ├── layout/                  # Sidebar + Header (role-aware, no switcher)
│   │   ├── ui/                      # Avatar, Badge, Button, Card, Input
│   │   └── views/                   # Page-level view components
│   ├── lib/
│   │   ├── api.ts                   # Typed API client (fetch wrapper)
│   │   ├── authStore.ts             # JWT token management + role decoding
│   │   ├── roleStore.ts             # Role derived from JWT — read-only
│   │   ├── postStore.ts             # Client-side post state
│   │   ├── mockData.ts              # Mock data for unimplemented modules
│   │   └── viewContext.tsx          # Active view context
│   ├── next.config.ts               # Turbopack + optimizePackageImports
│   ├── .env.local                   # Frontend env (gitignored)
│   └── .env.example                 # Template — copy to .env.local
├── API_TESTING.md                   # API test guide (curl, PowerShell, REST Client)
└── README.md
```

---

## API Endpoints

### Auth & Users

| Method | URL | Auth | Description |
|---|---|---|---|
| GET | `/` | — | Health check |
| GET | `/test-db` | — | PostgreSQL connection check |
| POST | `/auth/register` | — | Register a new user |
| POST | `/auth/login` | — | Login, returns JWT token |
| GET | `/api/v1/users/me` | ✅ JWT | Get current logged-in user |
| PATCH | `/api/v1/users/me/password` | ✅ JWT | Change current user's password |
| GET | `/api/v1/users/list` | ✅ JWT | List all users (Admin use) |

### Social Accounts

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/accounts/connect` | ✅ JWT | Manually connect a social account (supply tokens directly) |
| GET | `/api/v1/accounts/list` | ✅ JWT | List connected accounts for current user |

### OAuth — Platform Authorization Flow

| Method | URL | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/oauth/facebook/authorize` | ✅ JWT | Returns Facebook OAuth 2.0 authorization URL |
| GET | `/api/v1/oauth/facebook/callback` | — | Exchanges code → long-lived page tokens, saves all pages |
| GET | `/api/v1/oauth/instagram/authorize` | ✅ JWT | Returns Instagram (Facebook app) authorization URL |
| GET | `/api/v1/oauth/instagram/callback` | — | Exchanges code → fetches IG Business Account IDs, saves them |
| GET | `/api/v1/oauth/linkedin/authorize` | ✅ JWT | Returns LinkedIn OAuth 2.0 authorization URL |
| GET | `/api/v1/oauth/linkedin/callback` | — | Exchanges code → access token, saves member URN |
| GET | `/api/v1/oauth/twitter/authorize` | ✅ JWT | OAuth 1.0a step 1 — returns Twitter authorize URL |
| GET | `/api/v1/oauth/twitter/callback` | — | OAuth 1.0a step 2 — exchanges verifier → access token, saves account |
| GET | `/api/v1/oauth/youtube/authorize` | ✅ JWT | Returns Google OAuth 2.0 authorization URL (YouTube scopes) |
| GET | `/api/v1/oauth/youtube/callback` | — | Exchanges code → tokens, fetches channel info, saves account |

### Content (Posts, Drafts, Media)

| Method | URL | Auth | Description |
|---|---|---|---|
| **POST** | **`/api/v1/content/posts`** | ✅ JWT | Create a post (auto-saves MongoDB draft) |
| **GET** | **`/api/v1/content/posts`** | ✅ JWT | List posts (`?status=` / `?platform=` filters) |
| **GET** | **`/api/v1/content/posts/{id}`** | ✅ JWT | Get a single post |
| **PATCH** | **`/api/v1/content/posts/{id}`** | ✅ JWT | Partially update a post |
| **DELETE** | **`/api/v1/content/posts/{id}`** | ✅ JWT | Delete post + its MongoDB draft + S3 media objects |
| **GET** | **`/api/v1/content/drafts`** | ✅ JWT | List all MongoDB content drafts |
| **GET** | **`/api/v1/content/drafts/{post_id}`** | ✅ JWT | Get rich draft document for a post |
| **POST** | **`/api/v1/content/media`** | ✅ JWT | Store media asset metadata in MongoDB |
| **GET** | **`/api/v1/content/media`** | ✅ JWT | List user's media library |

### Media Upload (AWS S3)

| Method | URL | Auth | Description |
|---|---|---|---|
| **POST** | **`/api/v1/media/upload`** | ✅ JWT | Upload image/video files to S3, returns public URLs. Accepts `multipart/form-data` with `files[]` + `content_type` field. Max 10 files, 25 MB each. |
| **DELETE** | **`/api/v1/media/delete`** | ✅ JWT | Batch-delete S3 objects by URL. Body: `{ "urls": ["https://..."] }` |

### Publishing

| Method | URL | Auth | Description |
|---|---|---|---|
| **POST** | **`/api/v1/publish/{post_id}`** | ✅ JWT | Queue a post for immediate publishing via Celery |
| **GET** | **`/api/v1/publish/status/{task_id}`** | ✅ JWT | Poll publish task status (PENDING / STARTED / SUCCESS / FAILURE) |

### Logs & Notifications

| Method | URL | Auth | Description |
|---|---|---|---|
| **GET** | **`/api/v1/content/logs`** | ✅ JWT | List all publishing logs by joining Queue and SocialAccount |
| **GET** | **`/api/v1/notifications`** | ✅ JWT | List all notifications for the current user |
| **PATCH** | **`/api/v1/notifications/{id}`** | ✅ JWT | Update a notification's read status |
| **DELETE** | **`/api/v1/notifications/{id}`** | ✅ JWT | Delete a notification |

### Campaigns & Teams

| Method | URL | Auth | Description |
|---|---|---|---|
| **GET** | **`/api/v1/campaigns`** | ✅ JWT | List user's campaigns (`?status=` filter) |
| **POST** | **`/api/v1/campaigns`** | ✅ JWT | Create a new campaign |
| **GET** | **`/api/v1/campaigns/{id}`** | ✅ JWT | Get a single campaign |
| **PATCH** | **`/api/v1/campaigns/{id}`** | ✅ JWT | Partially update a campaign |
| **DELETE** | **`/api/v1/campaigns/{id}`** | ✅ JWT | Delete a campaign |
| **GET** | **`/api/v1/campaigns/{id}/posts`** | ✅ JWT | List all posts linked to a campaign |
| **POST** | **`/api/v1/campaigns/{id}/posts`** | ✅ JWT | Associate a post with a campaign |
| **DELETE** | **`/api/v1/campaigns/{id}/posts/{post_id}`** | ✅ JWT | Remove a post from a campaign |
| **GET** | **`/api/v1/campaigns/{id}/metrics`** | ✅ JWT | Aggregated campaign metrics (impressions, clicks, ROI) |
| **GET** | **`/api/v1/teams`** | ✅ JWT | List teams the current user is a member of |
| **POST** | **`/api/v1/teams`** | ✅ JWT | Create a new team |

### Analytics & Reports

| Method | URL | Auth | Description |
|---|---|---|---|
| **GET** | **`/api/v1/analytics/dashboard`** | ✅ JWT | Engagement data, follower distribution, and top posts. Triggers background MongoDB sync via Celery. |
| **GET** | **`/api/v1/analytics/audience-growth/{account_id}`** | ✅ JWT | Daily follower growth for a specific social account (`?start_date=`) |
| **GET** | **`/api/v1/analytics/platform-stats`** | ✅ JWT | Per-platform impressions, engagement rate, and post count — aggregated from MongoDB |
| **GET** | **`/api/v1/reports`** | ✅ JWT | Real monthly post counts (PostgreSQL), top posts by engagement (MongoDB), publishing status stats, and audience totals |

### Recurring Posts

| Method | URL | Auth | Description |
|---|---|---|---|
| **GET** | **`/api/v1/recurring`** | ✅ JWT | List all recurring schedules for the current user |
| **POST** | **`/api/v1/recurring`** | ✅ JWT | Create a new recurring schedule |
| **PATCH** | **`/api/v1/recurring/{id}/toggle`** | ✅ JWT | Toggle a recurring schedule active/inactive |
| **DELETE** | **`/api/v1/recurring/{id}`** | ✅ JWT | Delete a recurring schedule |

---

## OAuth & Platform Connection Flow

```
Frontend                       Backend                        Platform
   │                              │                               │
   │  GET /oauth/{p}/authorize    │                               │
   │ ────────────────────────────►│                               │
   │  { authorize_url: "..." }    │                               │
   │ ◄────────────────────────────│                               │
   │                              │                               │
   │  redirect user to authorize_url                              │
   │ ─────────────────────────────────────────────────────────────►
   │                              │    user grants permission     │
   │                              │ ◄─────────────────────────────│
   │                              │  code + state                 │
   │  GET /oauth/{p}/callback     │                               │
   │ ────────────────────────────►│                               │
   │                              │  exchange code → tokens       │
   │                              │ ─────────────────────────────►│
   │                              │  access_token + refresh_token │
   │                              │ ◄─────────────────────────────│
   │                              │  encrypt tokens               │
   │                              │  save to social_accounts      │
   │  { status: "connected" }     │                               │
   │ ◄────────────────────────────│                               │
```

---

## Publishing Flow

```
POST /api/v1/publish/{post_id}
        │
        ├──► [Celery Available] ──► publish_post.delay(post_id) ──► Redis Queue ──► Celery Worker
        │
        └──► [Broker Down/Local] ──► BackgroundTasks.add_task() ──► FastAPI Async ThreadPool
                                              │
                                              ▼
                                 Load Post + SocialAccount from PostgreSQL
                                              │
                                              ▼
                                 Decrypt access_token (Fernet)
                                              │
                                              ▼
                                 Fetch extra_metadata from MongoDB draft
                                              │
                                              ▼
                                 Build PostPayload
                                              │
                                 ┌────────────▼────────────────────────┐
                                 │   dispatcher.dispatch_publish()     │
                                 │  "facebook"  → FacebookClient       │
                                 │  "instagram" → InstagramClient      │
                                 │  "linkedin"  → LinkedInClient       │
                                 │  "twitter"   → TwitterXClient       │
                                 │  "youtube"   → YouTubeClient        │
                                 └────────────┬────────────────────────┘
                                              │  PublishResult { success, platform_post_id }
                                              ▼
                                 Update Post.status = "published" | "failed"
                                 Set Post.published_at = now()
```

Scheduled posts are monitored automatically:
1. **Celery Beat**: Runs `check_and_publish_scheduled_posts` every 60s.
2. **FastAPI Background Loop**: `_scheduled_publishing_loop` in `app/main.py` scans PostgreSQL every 25s for due posts (`scheduled_time <= now()`) using `starlette.concurrency.run_in_threadpool`.

---

## Platform API Details

| Platform | Protocol | Client Library | Key Scopes / Permissions |
|---|---|---|---|
| **Facebook** | OAuth 2.0 | httpx (Graph API v19) | `pages_manage_posts`, `pages_read_engagement`, `pages_show_list` |
| **Instagram** | OAuth 2.0 (via Facebook app) | httpx (Instagram Graph API) | `instagram_basic`, `instagram_content_publish` |
| **LinkedIn** | OAuth 2.0 | httpx (API v2) | `w_member_social`, `r_liteprofile`, `openid`, `profile` |
| **X (Twitter)** | OAuth 1.0a | Tweepy 4.x | Read + Write app permissions |
| **YouTube** | OAuth 2.0 (Google) | google-api-python-client | `youtube.upload`, `youtube.force-ssl` |

### Supported Content Types per Platform

| Content Type | Facebook | Instagram | LinkedIn | X/Twitter | YouTube |
|---|---|---|---|---|---|
| Text | ✅ | ❌ (requires media) | ✅ | ✅ | ✅ Community Post |
| Image | ✅ | ✅ | ✅ | ✅ (up to 4) | ✅ Community Post |
| Video | ✅ | ✅ | ✅ | ✅ | ✅ Upload |
| Carousel | ✅ (multi-photo) | ✅ (up to 10) | ✅ (multi-image) | ✅ (up to 4 images) | ❌ |
| Reel | ❌ | ✅ | ❌ | ❌ | ❌ |
| Story | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## Role-Based Access Control

Roles are assigned at registration and encoded in the JWT. The frontend derives the role exclusively from the token — users cannot change or override their role.

| Role | Pages Accessible |
|---|---|
| `Administrator` | Dashboard, Users, Teams, Campaigns, Reports, Analytics, Accounts, Notifications, Profile |
| `Marketing Team` | Dashboard, Campaigns, Analytics, Reports, Accounts, Notifications, Profile |
| `Content Creator` | Dashboard, Create Post, Calendar, Accounts, Notifications, Profile |
| `Business User` | Dashboard, Campaigns, Analytics, Reports, Notifications, Profile |

Accessing a restricted page shows an **Access Restricted** screen instead of the content.

---

## Database Schema

13 PostgreSQL tables covering all modules:

| Table | Purpose | Status |
|---|---|---|
| `users` | Auth, roles, account settings | ✅ Live |
| `social_accounts` | Connected platform accounts (encrypted tokens) | ✅ Live |
| `posts` | All post content, platform, status, media_urls | ✅ Live |
| `scheduled_posts` | Schedule metadata + recurrence + Celery task ID | ✅ Live |
| `queue` | Publish queue with retry tracking and status | ✅ Live |
| `teams` | Team grouping | ✅ Live |
| `team_members` | User ↔ Team mapping with roles | ✅ Live |
| `campaigns` | Campaign definitions with budget/objective/description | ✅ Live |
| `campaign_posts` | Post ↔ Campaign mapping | ✅ Live |
| `publishing_logs` | Publish attempts, retries, API responses | Planned |
| `analytics` | Per-post metrics (likes, reach, clicks, etc.) | Planned |
| `campaign_analytics` | Aggregated campaign-level metrics + ROI | Planned |
| `notifications` | User alerts for publish events | ✅ Live |
| `reports` | Generated PDF/Excel report file references | Planned |

**MongoDB collections**

| Collection | Purpose | Status |
|---|---|---|
| `content_drafts` | Rich content documents per post (body, hashtags, mentions, media refs) | ✅ Live |
| `media` | Media asset metadata (filename, URL, type, size) | ✅ Live |
| `analytics` | Per-post engagement metrics — synced via Celery `collect_post_analytics` task | ✅ Live |
| `campaign_analytics` | Campaign-level aggregated metrics | Planned |

Full schema: [`backend/migrations/001_initial_schema.sql`](backend/migrations/001_initial_schema.sql)

---

## Celery Background Tasks

| Task | Schedule | Purpose |
|---|---|---|
| `check_and_publish_scheduled_posts` | Every 60s (beat) | Queries DB for due scheduled posts → dispatches `publish_post` |
| `publish_post` | On demand | Decrypts tokens → calls platform API → updates post status, retries up to 3× |
| `collect_post_analytics` | On demand | Fetches metrics for a published post |
| `collect_campaign_analytics` | On demand | Aggregates metrics across a campaign |
| `send_publish_notification` | On demand | Notifies user of publish success/failure |
| `send_campaign_alert` | On demand | Sends campaign-level alerts |

---

## Local Setup

### Prerequisites
- Python 3.11+
- PostgreSQL (running locally or remote)
- MongoDB Atlas account
- Redis (needed for Celery tasks)
- Node.js 18+

### 1. Backend — Install dependencies
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/macOS
pip install -r requirements.txt
```

### 2. Backend — Configure environment
```bash
copy .env.example .env       # Windows
cp .env.example .env         # Linux/macOS
```

Edit `.env` with your credentials:
```env
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

DATABASE_URL=postgresql://socialpilot_user:your_password@localhost:5432/socialpilot

MONGODB_URL=mongodb+srv://your username: your password@your database/?retryWrites=true&w=majority&appName=socialpilot
MONGODB_DB=socialpilot

REDIS_URL=redis://localhost:6379

ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Generate once with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
TOKEN_ENCRYPTION_KEY=your_fernet_key_here
```

### 3. Configure Social Media Platform Credentials

Each platform requires a developer account. Add to `.env`:

#### Facebook & Instagram
1. Go to [developers.facebook.com](https://developers.facebook.com) → Create App
2. Add products: **Facebook Login**, **Instagram Graph API**
3. Required permissions: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`

```env
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_REDIRECT_URI=http://localhost:8000/api/v1/oauth/facebook/callback
INSTAGRAM_REDIRECT_URI=http://localhost:8000/api/v1/oauth/instagram/callback
```

#### LinkedIn
1. Go to [linkedin.com/developers](https://www.linkedin.com/developers) → Create App
2. Add products: **Share on LinkedIn**, **Sign In with LinkedIn using OpenID Connect**
3. Required scopes: `w_member_social`, `r_liteprofile`, `openid`, `profile`, `email`

```env
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=http://localhost:8000/api/v1/oauth/linkedin/callback
```

#### X (Twitter)
1. Go to [developer.x.com](https://developer.x.com) → Create Project + App
2. Set **App Permissions** to **Read and Write**
3. Add callback URL: `http://localhost:8000/api/v1/oauth/twitter/callback`

```env
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_BEARER_TOKEN=
TWITTER_REDIRECT_URI=http://localhost:8000/api/v1/oauth/twitter/callback
```

#### YouTube
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → Enable **YouTube Data API v3**
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized redirect URI: `http://localhost:8000/api/v1/oauth/youtube/callback`

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/oauth/youtube/callback
```

### 4. Configure AWS S3 for Media Uploads

Media uploads (images, videos, carousels, reels, stories) are stored in an **AWS S3 bucket**.
Follow these steps to create your bucket and wire it up:

#### Step 1 — Create an S3 Bucket

1. Sign in to the [AWS Console](https://s3.console.aws.amazon.com/s3) and open **S3**.
2. Click **Create bucket**.
3. Enter a globally unique **Bucket name** (e.g. `socialpilot-media`).
4. Choose a **Region** close to your users (e.g. `ap-south-1` for India — free tier eligible).
5. Under **Object Ownership** → select **ACLs enabled** → choose **Bucket owner preferred**.
   > This allows the backend to set `ACL: public-read` on each uploaded file so media URLs are directly viewable.
6. Under **Block Public Access settings** → **uncheck** `Block all public access`.
   Confirm the warning checkbox. Click **Create bucket**.

#### Step 2 — Add a Bucket Policy (optional — alternative to per-object ACLs)

If you prefer a bucket-wide policy instead of per-object ACLs, open your bucket → **Permissions** → **Bucket policy** and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::socialpilot-media/*"
    }
  ]
}
```

Replace `socialpilot-media` with your actual bucket name.

#### Step 3 — Create an IAM User with S3 access

1. Go to [AWS IAM](https://console.aws.amazon.com/iam) → **Users** → **Create user**.
2. Name it `socialpilot-backend` (or similar). Skip console access.
3. Click **Next: Permissions** → **Attach policies directly** → search and select **`AmazonS3FullAccess`**.
   > For production, create a custom policy limited to your specific bucket only.
4. Click **Create user**.
5. Open the user → **Security credentials** → **Create access key** → choose **Application running outside AWS** → click **Create**.
6. **Copy** the `Access Key ID` and `Secret Access Key` — you won't see the secret again.

#### Step 4 — Add to `.env`

```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=socialpilot-media
S3_PUBLIC_URL=https://socialpilot-media.s3.ap-south-1.amazonaws.com
```

> **Free Tier limits**: 5 GB storage, 20,000 GET requests, 2,000 PUT/DELETE requests, 15 GB data transfer out per month — more than enough for development and demos.

#### Step 5 — Verify S3 is wired up

```bash
# From backend/ with venv active
python -c "from dotenv import load_dotenv; load_dotenv(); from app.services.s3_service import s3_configured; print('S3 configured:', s3_configured())"
# Should print: S3 configured: True
```

### 5. Run Alembic migrations
```bash
alembic upgrade head
```

### 6. Start FastAPI server
```bash
uvicorn app.main:app --reload
```

Swagger UI: http://127.0.0.1:8000/docs

---

### 7. Frontend — Install dependencies
```bash
cd frontend
npm install
```

### 8. Frontend — Configure environment
```bash
copy .env.example .env.local   # Windows
cp .env.example .env.local     # Linux/macOS
```

`.env.local`:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### 9. Start frontend
```bash
npm run dev
```

Frontend: http://localhost:3000

> Dev server uses **Turbopack** for fast incremental compilation. First load takes a few seconds; subsequent hot reloads are near-instant.

---

### Celery — Background Publishing Workers

Required for scheduled posts and platform publishing.

```bash
# Start Redis
redis-server

# Start Celery worker (from backend/)
celery -A celery_worker worker --loglevel=info

# Start Celery beat scheduler (from backend/)
celery -A celery_worker beat --loglevel=info
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `SECRET_KEY` | JWT signing key — change before production |
| `ALGORITHM` | JWT algorithm (default: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry in minutes (default: `60`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `MONGODB_URL` | MongoDB Atlas connection string |
| `MONGODB_DB` | MongoDB database name (default: `socialpilot`) |
| `REDIS_URL` | Redis broker for Celery (default: `redis://localhost:6379`) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (default: `http://localhost:3000`) |
| `TOKEN_ENCRYPTION_KEY` | Fernet key for encrypting stored OAuth tokens |
| `FACEBOOK_APP_ID` | Facebook developer app ID |
| `FACEBOOK_APP_SECRET` | Facebook developer app secret |
| `FACEBOOK_REDIRECT_URI` | Facebook OAuth callback URL |
| `INSTAGRAM_REDIRECT_URI` | Instagram OAuth callback URL (same Facebook app) |
| `LINKEDIN_CLIENT_ID` | LinkedIn app client ID |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn app client secret |
| `LINKEDIN_REDIRECT_URI` | LinkedIn OAuth callback URL |
| `TWITTER_API_KEY` | Twitter/X OAuth 1.0a consumer key |
| `TWITTER_API_SECRET` | Twitter/X OAuth 1.0a consumer secret |
| `TWITTER_BEARER_TOKEN` | Twitter/X app-only bearer token |
| `TWITTER_REDIRECT_URI` | Twitter OAuth callback URL |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret |
| `GOOGLE_REDIRECT_URI` | Google (YouTube) OAuth callback URL |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key for S3 |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key for S3 |
| `AWS_REGION` | S3 bucket region (e.g. `ap-south-1`) |
| `S3_BUCKET_NAME` | S3 bucket name (e.g. `socialpilot-media`) |
| `S3_PUBLIC_URL` | Base public URL of the bucket (e.g. `https://socialpilot-media.s3.ap-south-1.amazonaws.com`) |
| `DEV_MOCK_PUBLISH` | Set to `true` to simulate social API calls locally without real keys |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (default: `http://127.0.0.1:8000`) |

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

Tests mock all external HTTP calls and run without live API credentials.

---

## Known Issues & Fixes

| Issue | Fix |
|---|---|
| `bcrypt` incompatibility with `passlib` | Pinned `bcrypt==4.0.1` in requirements |
| `SECRET_KEY` hardcoded | Moved to `.env` via `pydantic-settings` |
| `UserRole` enum in `UserOut` caused 500 on `/users/me` | Changed `role` field to plain `str` in Pydantic schema |
| Accounts endpoints exposed open `user_id` param | Replaced with `get_current_user` JWT dependency |
| CORS origins hardcoded | Moved to `ALLOWED_ORIGINS` env variable |
| Dashboard and profile showed hardcoded dummy name | Header, Sidebar, Profile now fetch live data via `/api/v1/users/me` |
| Profile page "Change Password" did nothing | Wired to `PATCH /api/v1/users/me/password` with real error feedback |
| All users had Admin access regardless of role | Role derived exclusively from JWT — manual role selector and switcher removed |
| Slow dev compilation | Switched from `--webpack` to `--turbopack`; added `optimizePackageImports` for icon libraries |
| `psycopg2-binary>=2.9.12` failed on Python 3.8 (no cp38 wheel) | Pinned to `==2.9.9` — last version shipping a precompiled `cp38-win_amd64` wheel |
| Startup crash: `NoReferencedTableError` on `queue.post_id` | Created `Post` and `ScheduledPost` SQLAlchemy models so FK targets exist before `create_all` |
| `celery.py` at backend root shadowed the `celery` package | Renamed to `celery_app_config.py`; Celery entry point is `celery_worker.py` |
| Python 3.8 `asyncio.to_thread` error in background tasks | Replaced `asyncio.to_thread` with `starlette.concurrency.run_in_threadpool` in `main.py` |
| HTTP 204 No Content returned JSON parsing error in `handleResponse` | Updated `handleResponse` in `lib/api.ts` to return empty object `{}` on 204 status |
| `Notification` insert failed with `NotNullViolation: title` | Added title field to default Notification objects in `notification.py` |
| Platform name mismatch between frontend (`X`) & backend (`twitter`) | Added automatic platform alias normalization (`x` $\leftrightarrow$ `twitter`) in backend dispatcher and frontend views |
| `media_urls` always sent as `[]` from frontend | Wired `apiUploadMedia()` in `CreatePostView.tsx` — files now upload to S3 before post creation, real URLs stored in PostgreSQL |
| Deleting a post left orphaned S3 files | `delete_post` in `content.py` fetches `media_urls` before deletion and calls `delete_files_from_s3()` |
| Publishing Logs showed no media thumbnails | Added image/video thumbnail grid in `PublishingLogsView.tsx` rendering S3 URLs with `+N more` overflow badge |
| `Campaign` model missing `description`, `objective`, and post association | Added fields to `Campaign` model, created `CampaignPost` association model, and Alembic migration `a3f1c2d4e5b6` |
| Campaigns router missing `GET /{id}` and `PATCH /{id}` | Added full CRUD + `/posts` association endpoints + `/metrics` to `routers/campaigns.py` |
| `reports.py` returned hardcoded mock data | Replaced with real PostgreSQL `GROUP BY month` + MongoDB aggregation for monthly data, top posts, totals, and publishing stats |
| `jspdf` missing from `node_modules` | Added `jspdf` to frontend dependencies via `npm install jspdf` |
| Publishing History tab showed static post counts (298/16/3) | Wired to `publishing_stats` field from `/api/v1/reports` — real counts from PostgreSQL |
| Platform Comparison tab showed placeholder data | Wired to new `/api/v1/analytics/platform-stats` endpoint pulling live MongoDB aggregations |
| Campaign ROI table had 2 hardcoded rows | Now dynamically renders all user campaigns with estimated CPC and ROI calculation |
| Campaign creation form missing date and objective fields | Added start date, end date, and objective/description fields to `CampaignsView.tsx` modal |

---

## 8-Week Roadmap

| Week | Focus | Status |
|---|---|---|
| 1–2 | Setup, auth, DB schema, social account connection | ✅ Complete |
| 3–4 | Content Service APIs, post CRUD, MongoDB drafts, media library | ✅ Complete |
| 3–4 | Social media API integration, OAuth flows, real platform publishing | ✅ Complete |
| 5–6 | Campaigns, analytics dashboard, reports | ✅ Complete |
| 7–8 | Testing, Docker deployment, documentation | Planned |

---

## Minimum Viable Product

- [x] User registration and login
- [x] Role-based access (Content Creator, Marketing Team, Business User, Administrator)
- [x] JWT-protected API endpoints
- [x] Connect and list social media accounts
- [x] PostgreSQL live with Alembic migrations
- [x] MongoDB Atlas connected
- [x] Frontend wired to backend (register, login, accounts)
- [x] Dashboard and header show real logged-in user name
- [x] Profile page shows live user data and connected accounts
- [x] Change password wired to backend with validation
- [x] Role enforcement — UI access controlled by JWT role, no manual override
- [x] User Management panel fetches live users from database
- [x] Post CRUD API — create, list, get, update, delete
- [x] MongoDB auto-draft on post create/update
- [x] Content draft retrieval (per-user and per-post)
- [x] Media metadata storage and library API
- [x] OAuth flow for real platform token acquisition (Facebook, Instagram, LinkedIn, X, YouTube)
- [x] Platform API clients — publish text, images, videos, carousels to platforms
- [x] Fernet token encryption — OAuth credentials never stored as plain text
- [x] Auto-publish via Celery worker / FastAPI BackgroundTasks (beat scheduler + on-demand trigger)
- [x] Publish status polling endpoint
- [x] Create and schedule a post (frontend)
- [x] Calendar view of scheduled posts (interactive Month/Week/Day, drag-and-drop reschedule)
- [x] View publish status and diagnostic log trace in frontend
- [x] Draft management grid with case-insensitive search and status filter
- [x] Optimistic single & bulk delete across Calendar, Drafts, and Publishing Logs
- [x] AWS S3 media upload — images, videos, carousels, stories, reels uploaded to cloud on post create
- [x] Media thumbnails visible in Publishing Logs for image and video posts
- [x] Automatic S3 cleanup on post deletion (no orphaned files)
- [x] Campaign CRUD — create, list, get, update, delete
- [x] Campaign post association — link/unlink scheduled posts to campaigns
- [x] Campaign metrics endpoint — aggregated impressions, clicks, ROI
- [x] Campaign creation form — start/end date, objective, budget fields
- [x] Export report as PDF — custom styled jsPDF with engagement, campaign, audience, platform comparison tabs
- [x] Export report as CSV/Excel — downloadable spreadsheet with monthly and campaign data
- [x] AI Post Assistant — Google Gemini AI for content generation, tone rewriting, grammar fix, CTA addition
- [x] Analytics dashboard — live MongoDB aggregation with background Celery sync
- [x] Per-platform analytics stats endpoint — impressions, engagement rate, post count
- [x] Reports fully wired to real data — monthly PostgreSQL counts + MongoDB engagement aggregates
- [x] Publishing History report — real published/scheduled/failed counts from PostgreSQL
- [x] Platform Comparison report — live per-platform stats from MongoDB
- [x] Campaign ROI table — dynamic render with estimated CPC and ROI per campaign
