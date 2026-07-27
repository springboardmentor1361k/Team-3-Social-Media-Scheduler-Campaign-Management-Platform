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
from app.mongodb import get_mongo_client
client = get_mongo_client()
print('MongoDB OK:', client.server_info()['version'])
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

## Troubleshooting

| Error | Fix |
|---|---|
| `permission denied for schema public` | Run `GRANT ALL ON SCHEMA public TO socialpilot_user;` inside `\c socialpilot` |
| `could not connect to server` | Make sure PostgreSQL service is running |
| `authentication failed` | Check username/password in `DATABASE_URL` |
| `MongoDB connection timeout` | Check IP whitelist in Atlas Network Access |
| `ServerSelectionTimeoutError` | Check `MONGODB_URL` string is correct in `.env` |
