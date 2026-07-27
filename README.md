# SocialPilot

A centralized social media scheduler and campaign management platform for content creators, marketing teams, and businesses.

---

## What It Does

- Connect Facebook, Instagram, LinkedIn, X/Twitter, YouTube, and Pinterest accounts via OAuth
- Create, draft, and schedule posts across multiple social platforms with automatic platform name normalization (`X` ↔ `twitter`)
- Auto-publish posts via background Celery workers or FastAPI `BackgroundTasks` fallback with automatic retry logic
- In-process background publishing loop (`_scheduled_publishing_loop`) for seamless local execution without requiring Redis
- Token encryption at rest — OAuth credentials never stored as plain text
- Interactive Calendar View for scheduling, drag-and-drop rescheduling, and status management
- Rich Drafts Management Grid backed by PostgreSQL and MongoDB document storage
- Real-time Publishing Logs with KPI metrics, error trace inspection drawer, and manual retry options
- Manage marketing campaigns, recurring schedules, and team workspaces
- View engagement, audience, and campaign analytics
- Export reports as PDF or Excel

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
│   │   │   ├── 9840678fc460_initial_schema.py          # Migration: users + social_accounts
│   │   │   └── <hash>_add_posts_scheduled_posts_queue.py  # Migration: posts + scheduled_posts + queue
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
│   │   │   ├── campaign.py          # Campaign model
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
│   │   │   ├── content.py           # /api/v1/content/* — post CRUD + drafts + media
│   │   │   ├── publishing.py        # /api/v1/publish/{post_id} + /status/{task_id}  ← UPDATED
│   │   │   ├── oauth.py             # /api/v1/oauth/{platform}/authorize + /callback  ← NEW
│   │   │   ├── notification.py      # /api/v1/notifications
│   │   │   ├── campaigns.py         # /api/v1/campaigns
│   │   │   ├── teams.py             # /api/v1/teams
│   │   │   ├── analytics.py         # /api/v1/analytics
│   │   │   ├── reports.py           # /api/v1/reports
│   │   │   └── recurring.py         # /api/v1/recurring
│   │   ├── schemas/
│   │   │   ├── auth.py              # Pydantic schemas (User + SocialAccount)
│   │   │   └── content.py           # Pydantic schemas (Post + Draft + Media)
│   │   ├── services/
│   │   │   ├── content_service.py       # PostgreSQL CRUD for Post entity
│   │   │   └── mongo_content_service.py # Async MongoDB ops (drafts + media metadata)
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
| **DELETE** | **`/api/v1/content/posts/{id}`** | ✅ JWT | Delete post + its MongoDB draft |
| **GET** | **`/api/v1/content/drafts`** | ✅ JWT | List all MongoDB content drafts |
| **GET** | **`/api/v1/content/drafts/{post_id}`** | ✅ JWT | Get rich draft document for a post |
| **POST** | **`/api/v1/content/media`** | ✅ JWT | Store media asset metadata in MongoDB |
| **GET** | **`/api/v1/content/media`** | ✅ JWT | List user's media library |

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
| **GET** | **`/api/v1/campaigns`** | ✅ JWT | List user's campaigns |
| **POST** | **`/api/v1/campaigns`** | ✅ JWT | Create a new campaign |
| **DELETE** | **`/api/v1/campaigns/{id}`** | ✅ JWT | Delete a campaign |
| **GET** | **`/api/v1/teams`** | ✅ JWT | List teams the current user is a member of |
| **POST** | **`/api/v1/teams`** | ✅ JWT | Create a new team |

### Analytics & Reports

| Method | URL | Auth | Description |
|---|---|---|---|
| **GET** | **`/api/v1/analytics/dashboard`** | ✅ JWT | Get engagement data, follower distribution, and top posts for dashboards |
| **GET** | **`/api/v1/reports`** | ✅ JWT | Get monthly summary tables and top performing post tables for reports |

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
| `teams` | Team grouping | Planned |
| `team_members` | User ↔ Team mapping with roles | Planned |
| `campaigns` | Campaign definitions with budget/objective | Planned |
| `campaign_posts` | Post ↔ Campaign mapping | Planned |
| `publishing_logs` | Publish attempts, retries, API responses | Planned |
| `analytics` | Per-post metrics (likes, reach, clicks, etc.) | Planned |
| `campaign_analytics` | Aggregated campaign-level metrics + ROI | Planned |
| `notifications` | User alerts for publish events | Planned |
| `reports` | Generated PDF/Excel report file references | Planned |

**MongoDB collections**

| Collection | Purpose | Status |
|---|---|---|
| `content_drafts` | Rich content documents per post (body, hashtags, mentions, media refs) | ✅ Live |
| `media` | Media asset metadata (filename, URL, type, size) | ✅ Live |
| `analytics` | Per-post engagement metrics | Planned |
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

MONGODB_URL=mongodb+srv://your_user:your_password@your_cluster.mongodb.net/?retryWrites=true&w=majority&appName=socialpilot
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

### 4. Run Alembic migrations
```bash
alembic upgrade head
```

### 5. Start FastAPI server
```bash
uvicorn app.main:app --reload
```

Swagger UI: http://127.0.0.1:8000/docs

---

### 6. Frontend — Install dependencies
```bash
cd frontend
npm install
```

### 7. Frontend — Configure environment
```bash
copy .env.example .env.local   # Windows
cp .env.example .env.local     # Linux/macOS
```

`.env.local`:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### 8. Start frontend
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

---

## 8-Week Roadmap

| Week | Focus | Status |
|---|---|---|
| 1–2 | Setup, auth, DB schema, social account connection | ✅ Complete |
| 3–4 | Content Service APIs, post CRUD, MongoDB drafts, media library | ✅ Complete |
| 3–4 | Social media API integration, OAuth flows, real platform publishing | ✅ Complete |
| 5–6 | Campaigns, analytics dashboard, reports | Planned |
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
- [ ] Basic analytics dashboard
- [ ] Export report as PDF or Excel
