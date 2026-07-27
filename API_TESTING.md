# SocialPilot API Testing Guide

Base URL: `http://127.0.0.1:8000`

---

## Endpoints Overview

| Method | URL | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/test-db` | PostgreSQL connection check |
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login, returns JWT token |
| POST | `/api/v1/accounts/connect` | Connect a social media account |
| GET | `/api/v1/accounts/list` | List connected accounts for a user |

---

## Option 1: Swagger UI (Easiest)

Open in browser: http://127.0.0.1:8000/docs

Click any endpoint → "Try it out" → fill body → "Execute"

---

## Option 2: curl

### Health Check
```bash
curl http://127.0.0.1:8000/
```
Expected:
```json
{"status": "online", "message": "SocialPilot API is running.", "version": "1.0.0"}
```

---

### Database Check
```bash
curl http://127.0.0.1:8000/test-db
```
Expected:
```json
{"status": "success", "message": "Database connected successfully!"}
```

---

### Register a User
```bash
curl -X POST http://127.0.0.1:8000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"John Doe\", \"email\": \"john@example.com\", \"password\": \"secret123\", \"role\": \"content_creator\"}"
```
Expected:
```json
{"id": 1, "name": "John Doe", "email": "john@example.com", "role": "content_creator", "is_active": true}
```

Error (duplicate email):
```json
{"detail": "Email already registered"}
```

---

### Login
```bash
curl -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"john@example.com\", \"password\": \"secret123\"}"
```
Expected:
```json
{"access_token": "<jwt_token>", "token_type": "bearer"}
```

Error (wrong credentials):
```json
{"detail": "Invalid email or password"}
```

---

### Connect a Social Account
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/accounts/connect?user_id=1" \
  -H "Content-Type: application/json" \
  -d "{\"platform\": \"linkedin\", \"account_name\": \"My Business Page\", \"platform_account_id\": \"li_123456\", \"access_token\": \"<platform_token>\", \"refresh_token\": null}"
```
Expected:
```json
{"id": 1, "user_id": 1, "platform": "linkedin", "account_name": "My Business Page", "platform_account_id": "li_123456", "access_token": "<platform_token>", "refresh_token": null, "status": "connected"}
```

Error (user not found):
```json
{"detail": "User not found."}
```

---

### List Connected Accounts
```bash
curl "http://127.0.0.1:8000/api/v1/accounts/list?user_id=1"
```
Expected:
```json
[
  {"id": 1, "user_id": 1, "platform": "linkedin", "account_name": "My Business Page", "status": "connected", ...}
]
```

---

## Option 3: PowerShell (Windows)

### Health Check
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/"
```

### Database Check
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/test-db"
```

### Register
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"name": "John Doe", "email": "john@example.com", "password": "secret123", "role": "content_creator"}'
```

### Login
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email": "john@example.com", "password": "secret123"}'
```

### Connect a Social Account
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/accounts/connect?user_id=1" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"platform": "linkedin", "account_name": "My Business Page", "platform_account_id": "li_123456", "access_token": "<platform_token>", "refresh_token": null}'
```

### List Connected Accounts
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/accounts/list?user_id=1"
```

---

## Option 4: REST Client (VS Code Extension)

Install the **REST Client** extension, create a file `test.http`, and paste:

```http
### Health Check
GET http://127.0.0.1:8000/

### Database Check
GET http://127.0.0.1:8000/test-db

### Register
POST http://127.0.0.1:8000/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "content_creator"
}

### Login
POST http://127.0.0.1:8000/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secret123"
}

### Connect a Social Account
POST http://127.0.0.1:8000/api/v1/accounts/connect?user_id=1
Content-Type: application/json

{
  "platform": "linkedin",
  "account_name": "My Business Page",
  "platform_account_id": "li_123456",
  "access_token": "<platform_token>",
  "refresh_token": null
}

### List Connected Accounts
GET http://127.0.0.1:8000/api/v1/accounts/list?user_id=1
```

Click "Send Request" above each block.

---

## Available Roles

| Role | Description |
|---|---|
| `content_creator` | Default role |
| `marketing_team` | Marketing team member |
| `business_user` | Business account user |
| `administrator` | Admin user |

---

## Supported Platforms

| Value | Platform |
|---|---|
| `facebook` | Facebook |
| `instagram` | Instagram |
| `linkedin` | LinkedIn |
| `twitter` | X (Twitter) |
| `youtube` | YouTube |
| `pinterest` | Pinterest |

> Platform values are lowercase strings.

---

## Account Status Values

| Value | Meaning |
|---|---|
| `connected` | Active and authorized |
| `expired` | Token has expired |
| `revoked` | Access was revoked |

---

## Error Reference

| Status | Meaning |
|---|---|
| 400 | Email already registered |
| 401 | Wrong email or password |
| 404 | User not found |
| 422 | Validation error (missing/invalid fields) |
| 500 | Database connection error |
