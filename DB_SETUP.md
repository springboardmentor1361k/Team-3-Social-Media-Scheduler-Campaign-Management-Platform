# Database Setup Guide

Step-by-step instructions to set up PostgreSQL and MongoDB for SocialPilot on a new machine.

---

## Prerequisites

- PostgreSQL 15+ installed — https://www.postgresql.org/download/
- MongoDB Atlas account — https://www.mongodb.com/atlas
- Python 3.11+ with venv activated

---

## Part 1: PostgreSQL Setup

### 1. Open psql as superuser

**Windows:**
```powershell
& "C:\Program Files\PostgreSQL\<version>\bin\psql.exe" -U postgres
```

**Linux/macOS:**
```bash
sudo -u postgres psql
```

---

### 2. Create database, user, and grant permissions

Run these commands inside the psql shell:

```sql
CREATE DATABASE socialpilot;

CREATE USER socialpilot_user WITH PASSWORD 'user123';

GRANT ALL PRIVILEGES ON DATABASE socialpilot TO socialpilot_user;

\c socialpilot

GRANT ALL ON SCHEMA public TO socialpilot_user;

\q
```

> Change `'user123'` to a strong password in production.

---

### 3. Update your .env

```env
DATABASE_URL=postgresql://socialpilot_user:user123@localhost:5432/socialpilot
```

---

### 4. Test the connection

```bash
cd backend
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/macOS

python -c "from app.database import engine; engine.connect(); print('PostgreSQL OK')"
```

---

## Part 2: MongoDB Atlas Setup

### 1. Create a free cluster

1. Go to https://www.mongodb.com/atlas
2. Sign up / Log in
3. Create a free **M0** cluster
4. Choose a cloud provider and region

---

### 2. Create a database user

1. Go to **Database Access** → Add New Database User
2. Set username and password
3. Set role to **Read and write to any database**

---

### 3. Whitelist your IP

1. Go to **Network Access** → Add IP Address
2. Click **Allow Access from Anywhere** (for dev) or add your specific IP

---

### 4. Get the connection string

1. Go to **Clusters** → Connect → **Drivers**
2. Select Python, version 3.12+
3. Copy the connection string — looks like:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
```

---

### 5. Update your .env

```env
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=socialpilot
```

---

### 6. Test the connection

```bash
python -c "
import asyncio
from app.mongodb import get_mongo_client
async def test():
    client = get_mongo_client()
    info = await client.server_info()
    print('MongoDB OK:', info['version'])
asyncio.run(test())
"
```

---

## Part 3: Run Alembic Migrations

Once PostgreSQL is set up and `.env` is configured:

```bash
cd backend
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/macOS

# Apply all migrations to PostgreSQL
alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Running upgrade -> <rev_id>, initial_schema
```

---

### To generate a new migration after model changes:

```bash
alembic revision --autogenerate -m "describe_your_change"
alembic upgrade head
```

---

## Full .env Reference

```env
# JWT
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# PostgreSQL
DATABASE_URL=postgresql://socialpilot_user:user123@localhost:5432/socialpilot

# MongoDB Atlas
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=socialpilot

# Redis / Celery
REDIS_URL=redis://localhost:6379
```

---

## Part 4: Redis Setup (required for Celery)

Redis is used as the **message broker and result backend** for Celery background tasks — including scheduled publishing, analytics sync, and notification dispatch.

> **Without Redis**, SocialPilot falls back to FastAPI `BackgroundTasks` for publishing (works for development), but scheduled post beat checking and analytics collection will not run.

---

### Windows — Install Redis via WSL2 or Memurai

**Option A — WSL2 (recommended)**

If WSL2 is installed:
```powershell
wsl --install           # install WSL2 if not already installed (reboot required)
wsl                     # open Ubuntu shell
sudo apt-get update
sudo apt-get install redis-server -y
sudo service redis-server start
redis-cli ping          # should respond: PONG
```

**Option B — Memurai (native Windows Redis-compatible)**

1. Download from [memurai.com/get-memurai](https://www.memurai.com/get-memurai)
2. Run the installer — Memurai installs as a Windows Service and starts automatically
3. Verify:
```powershell
memurai-cli ping   # should respond: PONG
```

**Option C — Docker**
```powershell
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

---

### Linux / macOS — Install Redis

```bash
# Ubuntu / Debian
sudo apt-get update
sudo apt-get install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server

# macOS (Homebrew)
brew install redis
brew services start redis
```

Verify it's running:
```bash
redis-cli ping   # should respond: PONG
```

---

### Verify Redis Connection from Python

```bash
cd backend
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/macOS

python -c "
import redis
r = redis.from_url('redis://localhost:6379')
print('Redis OK:', r.ping())
"
```

---

## Part 5: Celery Worker Setup

Celery handles all background jobs: scheduled publishing, analytics collection, and notification dispatch.

### Prerequisites
- Redis must be running (see Part 4)
- Python venv must be activated
- `.env` must have `REDIS_URL=redis://localhost:6379`

---

### Start the Celery Worker

Open a **new terminal** in the `backend/` directory:

```bash
# Windows
cd backend
venv\Scripts\activate
celery -A celery_worker worker --loglevel=info --pool=solo

# Linux / macOS
cd backend
source venv/bin/activate
celery -A celery_worker worker --loglevel=info
```

> **`--pool=solo`** is required on Windows because the default `prefork` pool uses `os.fork()` which is not supported on Windows. On Linux/macOS, omit this flag.

Expected startup output:
```
[config]
.> app:         socialpilot:0x...
.> transport:   redis://localhost:6379//
.> results:     redis://localhost:6379/
.> concurrency: 4 (prefork)

[queues]
.> celery           exchange=celery(direct) key=celery

[tasks]
  . tasks.publishing.publish_post
  . tasks.publishing.check_and_publish_scheduled_posts
  . tasks.analytics.collect_post_analytics
  . tasks.notifications.send_publish_notification
```

---

### Start the Celery Beat Scheduler

Beat runs the periodic task `check_and_publish_scheduled_posts` every 60 seconds.

Open a **third terminal** in `backend/`:

```bash
# Windows
venv\Scripts\activate
celery -A celery_worker beat --loglevel=info

# Linux / macOS
source venv/bin/activate
celery -A celery_worker beat --loglevel=info
```

---

### Run All Three Services Together

For convenience during development, you can run all three in separate terminal tabs:

| Terminal | Command | Purpose |
|---|---|---|
| 1 | `uvicorn app.main:app --reload` | FastAPI server |
| 2 | `celery -A celery_worker worker --loglevel=info --pool=solo` | Background task worker |
| 3 | `celery -A celery_worker beat --loglevel=info` | Scheduled task trigger |

> The FastAPI app also has a built-in `_scheduled_publishing_loop` that runs every 25s in a background thread — so even without Celery, scheduled posts will still publish during development.

---

### Monitoring Tasks (Optional — Flower)

Flower is a real-time Celery task monitor. Install and run:

```bash
pip install flower
celery -A celery_worker flower --port=5555
```

Open [http://localhost:5555](http://localhost:5555) to view active, pending, and failed tasks.

---

## Troubleshooting

| Error | Fix |
|---|---|
| `permission denied for schema public` | Run `GRANT ALL ON SCHEMA public TO socialpilot_user;` inside `\c socialpilot` |
| `could not connect to server` | Make sure PostgreSQL service is running |
| `authentication failed` | Check username/password in `DATABASE_URL` |
| `MongoDB connection timeout` | Check IP whitelist in Atlas Network Access |
| `ServerSelectionTimeoutError` | Check `MONGODB_URL` string is correct in `.env` |
| `redis.exceptions.ConnectionError` | Redis is not running — start it with `redis-server` or `sudo systemctl start redis-server` |
| Celery worker crashes on Windows | Use `--pool=solo` flag: `celery -A celery_worker worker --pool=solo` |
| `ModuleNotFoundError: No module named 'celery'` | Activate venv first: `venv\Scripts\activate` then re-run |
| Celery tasks not executing | Check that `REDIS_URL` in `.env` matches your running Redis instance |
| Beat scheduler not running | Start a separate terminal with `celery -A celery_worker beat` |

