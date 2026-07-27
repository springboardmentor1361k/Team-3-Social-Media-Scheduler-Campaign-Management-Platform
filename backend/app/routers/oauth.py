"""
app/routers/oauth.py
─────────────────────
OAuth 2.0 / OAuth 1.0a exchange endpoints for all supported platforms.

Flow
----
1. Client calls  GET /api/v1/oauth/{platform}/authorize
   → returns {"authorize_url": "https://platform.com/oauth/..."}
   → frontend redirects the user there

2. Platform redirects back to  GET /api/v1/oauth/{platform}/callback?code=...
   → backend exchanges code for tokens
   → tokens are encrypted and saved to social_accounts table
   → user is redirected / responded with success

Platforms & protocols
---------------------
  facebook   OAuth 2 (server-side code flow)
  instagram  Same Facebook app → same flow (adds instagram_content_publish scope)
  linkedin   OAuth 2 (server-side code flow)
  twitter    OAuth 1.0a request-token → authorize → access-token
  youtube    OAuth 2 (Google identity platform)
"""
from __future__ import annotations

import json
import logging
import os
import secrets
from urllib.parse import urlencode, urljoin

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse, JSONResponse, HTMLResponse
from sqlalchemy.orm import Session

from app.core.encryption import encrypt_token
from app.core.security import get_current_user
from app.database import get_db
from app.models.social_account import SocialAccount
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/oauth", tags=["OAuth"])

# ── In-memory state store (replace with Redis in production) ──────────────────
# Maps state_token → {"user_id": int, "platform": str, ...}
_STATE_STORE: dict = {}


def _save_state(state: str, data: dict) -> None:
    _STATE_STORE[state] = data


def _pop_state(state: str) -> dict | None:
    return _STATE_STORE.pop(state, None)


def _oauth_popup_response(status: str, message: str) -> HTMLResponse:
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>OAuth {status.title()}</title>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
            .card {{ background: #1e293b; padding: 2rem; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5); max-width: 420px; }}
            h2 {{ color: {'#22c55e' if status == 'connected' else '#eab308'}; margin-top: 0; }}
            p {{ color: #94a3b8; font-size: 1.05em; }}
            .small {{ font-size: 0.85em; color: #64748b; margin-top: 1.5rem; }}
        </style>
    </head>
    <body>
        <div class="card">
            <h2>{'✅ Connected!' if status == 'connected' else '⚠️ Notice'}</h2>
            <p>{message}</p>
            <p class="small">This window will close automatically in a moment...</p>
        </div>
        <script>
            if (window.opener) {{
                window.opener.postMessage({{ type: 'OAUTH_SUCCESS', status: '{status}' }}, '*');
            }}
            setTimeout(function() {{ window.close(); }}, 2200);
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html)


# ══════════════════════════════════════════════════════════════════════════════
# Helper: upsert social account after token exchange
# ══════════════════════════════════════════════════════════════════════════════

def _upsert_social_account(
    db: Session,
    user_id: int,
    platform: str,
    account_name: str,
    platform_account_id: str,
    access_token: str,
    refresh_token: str | None = None,
) -> SocialAccount:
    """Create or update a SocialAccount record with encrypted tokens."""
    existing = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.user_id == user_id,
            SocialAccount.platform == platform,
            SocialAccount.platform_account_id == platform_account_id,
        )
        .first()
    )

    enc_access = encrypt_token(access_token)
    enc_refresh = encrypt_token(refresh_token) if refresh_token else None

    if existing:
        existing.access_token = enc_access
        existing.refresh_token = enc_refresh
        existing.account_name = account_name
        existing.status = "connected"
        db.commit()
        db.refresh(existing)
        return existing

    account = SocialAccount(
        user_id=user_id,
        platform=platform,
        account_name=account_name,
        platform_account_id=platform_account_id,
        access_token=enc_access,
        refresh_token=enc_refresh,
        status="connected",
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


# ══════════════════════════════════════════════════════════════════════════════
# FACEBOOK / INSTAGRAM
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/facebook/authorize")
def facebook_authorize(current_user: User = Depends(get_current_user)):
    """
    Return the Facebook OAuth 2.0 authorization URL.
    Scopes cover both Facebook Page publishing and Instagram Content Publishing.
    """
    app_id = os.getenv("FACEBOOK_APP_ID", "")
    if not app_id:
        raise HTTPException(status_code=500, detail="FACEBOOK_APP_ID not configured")

    redirect_uri = os.getenv(
        "FACEBOOK_REDIRECT_URI",
        "http://localhost:8000/api/v1/oauth/facebook/callback",
    )
    state = secrets.token_urlsafe(32)
    _save_state(state, {"user_id": current_user.id, "platform": "facebook"})

    scopes = ",".join([
        "pages_manage_posts",
        "pages_read_engagement",
        "pages_show_list",
        "instagram_basic",
        "instagram_content_publish",
        "public_profile",
    ])

    params = {
        "client_id": app_id,
        "redirect_uri": redirect_uri,
        "scope": scopes,
        "response_type": "code",
        "state": state,
    }
    authorize_url = "https://www.facebook.com/v19.0/dialog/oauth?" + urlencode(params)
    return {"authorize_url": authorize_url}


@router.get("/facebook/callback")
def facebook_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    """Exchange Facebook auth code for a long-lived page access token."""
    state_data = _pop_state(state)
    if not state_data:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

    user_id = state_data["user_id"]
    app_id = os.getenv("FACEBOOK_APP_ID", "")
    app_secret = os.getenv("FACEBOOK_APP_SECRET", "")
    redirect_uri = os.getenv(
        "FACEBOOK_REDIRECT_URI",
        "http://localhost:8000/api/v1/oauth/facebook/callback",
    )

    # Step 1: Exchange code → short-lived user token
    resp = httpx.get("https://graph.facebook.com/v19.0/oauth/access_token", params={
        "client_id": app_id,
        "client_secret": app_secret,
        "redirect_uri": redirect_uri,
        "code": code,
    }, timeout=15)
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Facebook token exchange failed: {resp.text}")
    short_token = resp.json()["access_token"]

    # Step 2: Exchange short-lived → long-lived user token
    resp2 = httpx.get("https://graph.facebook.com/v19.0/oauth/access_token", params={
        "grant_type": "fb_exchange_token",
        "client_id": app_id,
        "client_secret": app_secret,
        "fb_exchange_token": short_token,
    }, timeout=15)
    long_token = resp2.json().get("access_token", short_token)

    # Step 3: Get user's pages and their page access tokens
    pages_resp = httpx.get("https://graph.facebook.com/v19.0/me/accounts", params={
        "access_token": long_token,
        "fields": "id,name,access_token",
    }, timeout=15)
    pages_resp.raise_for_status()
    pages = pages_resp.json().get("data", [])

    saved = []
    for page in pages:
        page_token = page.get("access_token", long_token)
        acct = _upsert_social_account(
            db,
            user_id=user_id,
            platform="facebook",
            account_name=page["name"],
            platform_account_id=page["id"],
            access_token=page_token,
        )
        saved.append(page["name"])

    if not saved:
        # No Pages — save the personal user token so the connection still works
        me_resp = httpx.get("https://graph.facebook.com/v19.0/me", params={
            "access_token": long_token,
            "fields": "id,name",
        }, timeout=15)
        me = me_resp.json() if me_resp.status_code == 200 else {}
        fb_name = me.get("name", "Facebook User")
        fb_id = me.get("id", "unknown")
        _upsert_social_account(
            db,
            user_id=user_id,
            platform="facebook",
            account_name=fb_name,
            platform_account_id=fb_id,
            access_token=long_token,
        )
        msg = f"Connected as '{fb_name}'. Note: Create a Facebook Page to enable page posting."
        return _oauth_popup_response("connected", msg)

    msg = f"Successfully connected {len(saved)} Facebook Page(s): {', '.join(saved)}!"
    return _oauth_popup_response("connected", msg)


# ── Instagram callback (same app, different scope/platform label) ─────────────

@router.get("/instagram/authorize")
def instagram_authorize(current_user: User = Depends(get_current_user)):
    """
    Return the authorization URL for Instagram (reuses the Facebook app).
    After callback the stored accounts will be labelled platform='instagram'.
    """
    app_id = os.getenv("FACEBOOK_APP_ID", "")
    if not app_id:
        raise HTTPException(status_code=500, detail="FACEBOOK_APP_ID not configured")

    redirect_uri = os.getenv(
        "INSTAGRAM_REDIRECT_URI",
        "http://localhost:8000/api/v1/oauth/instagram/callback",
    )
    state = secrets.token_urlsafe(32)
    _save_state(state, {"user_id": current_user.id, "platform": "instagram"})

    scopes = ",".join([
        "instagram_basic",
        "instagram_content_publish",
        "pages_show_list",
        "pages_read_engagement",
    ])
    params = {
        "client_id": app_id,
        "redirect_uri": redirect_uri,
        "scope": scopes,
        "response_type": "code",
        "state": state,
    }
    return {"authorize_url": "https://www.facebook.com/v19.0/dialog/oauth?" + urlencode(params)}


@router.get("/instagram/callback")
def instagram_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    """Exchange code → page token → fetch connected Instagram Business account IDs."""
    state_data = _pop_state(state)
    if not state_data:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

    user_id = state_data["user_id"]
    app_id = os.getenv("FACEBOOK_APP_ID", "")
    app_secret = os.getenv("FACEBOOK_APP_SECRET", "")
    redirect_uri = os.getenv(
        "INSTAGRAM_REDIRECT_URI",
        "http://localhost:8000/api/v1/oauth/instagram/callback",
    )

    # Exchange code → short-lived → long-lived user token
    resp = httpx.get("https://graph.facebook.com/v19.0/oauth/access_token", params={
        "client_id": app_id,
        "client_secret": app_secret,
        "redirect_uri": redirect_uri,
        "code": code,
    }, timeout=15)
    resp.raise_for_status()
    short_token = resp.json()["access_token"]

    resp2 = httpx.get("https://graph.facebook.com/v19.0/oauth/access_token", params={
        "grant_type": "fb_exchange_token",
        "client_id": app_id,
        "client_secret": app_secret,
        "fb_exchange_token": short_token,
    }, timeout=15)
    long_token = resp2.json().get("access_token", short_token)

    # Get pages, then get Instagram Business Account linked to each page
    pages_resp = httpx.get("https://graph.facebook.com/v19.0/me/accounts", params={
        "access_token": long_token,
        "fields": "id,name,access_token,instagram_business_account",
    }, timeout=15)
    pages_resp.raise_for_status()
    pages = pages_resp.json().get("data", [])

    saved = []
    for page in pages:
        ig_account = page.get("instagram_business_account")
        if not ig_account:
            continue
        ig_id = ig_account["id"]
        page_token = page.get("access_token", long_token)

        # Fetch IG username
        ig_info = httpx.get(f"https://graph.facebook.com/v19.0/{ig_id}", params={
            "fields": "id,username",
            "access_token": page_token,
        }, timeout=15).json()
        username = ig_info.get("username", ig_id)

        acct = _upsert_social_account(
            db,
            user_id=user_id,
            platform="instagram",
            account_name=username,
            platform_account_id=ig_id,
            access_token=page_token,
        )
    if not saved:
        msg = "No Instagram Business Accounts found linked to your Facebook Pages. Ensure your Instagram Business account is linked to your Facebook Page in Page Settings."
        return _oauth_popup_response("warning", msg)

    msg = f"Successfully connected {len(saved)} Instagram Business Account(s)!"
    return _oauth_popup_response("connected", msg)


# ══════════════════════════════════════════════════════════════════════════════
# LINKEDIN
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/linkedin/authorize")
def linkedin_authorize(current_user: User = Depends(get_current_user)):
    """Return the LinkedIn OAuth 2.0 authorization URL."""
    client_id = os.getenv("LINKEDIN_CLIENT_ID", "")
    if not client_id:
        raise HTTPException(status_code=500, detail="LINKEDIN_CLIENT_ID not configured")

    redirect_uri = os.getenv(
        "LINKEDIN_REDIRECT_URI",
        "http://localhost:8000/api/v1/oauth/linkedin/callback",
    )
    state = secrets.token_urlsafe(32)
    _save_state(state, {"user_id": current_user.id})

    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "state": state,
        "scope": "openid profile email w_member_social",
    }
    return {"authorize_url": "https://www.linkedin.com/oauth/v2/authorization?" + urlencode(params)}


@router.get("/linkedin/callback")
def linkedin_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    """Exchange LinkedIn auth code for an access token and save the account."""
    state_data = _pop_state(state)
    if not state_data:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

    user_id = state_data["user_id"]
    client_id = os.getenv("LINKEDIN_CLIENT_ID", "")
    client_secret = os.getenv("LINKEDIN_CLIENT_SECRET", "")
    redirect_uri = os.getenv(
        "LINKEDIN_REDIRECT_URI",
        "http://localhost:8000/api/v1/oauth/linkedin/callback",
    )

    # Exchange code → access token
    token_resp = httpx.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        data={
            "grant_type": "authorization_code",
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )
    if token_resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"LinkedIn token exchange failed: {token_resp.text}")

    token_data = token_resp.json()
    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token")

    # Fetch member profile to get URN and display name
    profile_resp = httpx.get(
        "https://api.linkedin.com/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=15,
    )
    profile_resp.raise_for_status()
    profile = profile_resp.json()
    member_id = profile.get("sub", "")          # LinkedIn OpenID sub = member ID
    display_name = profile.get("name", member_id)
    member_urn = f"urn:li:person:{member_id}"

    acct = _upsert_social_account(
        db,
        user_id=user_id,
        platform="linkedin",
        account_name=display_name,
        platform_account_id=member_urn,
        access_token=access_token,
        refresh_token=refresh_token,
    )
    msg = f"Successfully connected LinkedIn profile '{display_name}'!"
    return _oauth_popup_response("connected", msg)


# ══════════════════════════════════════════════════════════════════════════════
# TWITTER / X  (OAuth 1.0a)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/twitter/authorize")
def twitter_authorize(current_user: User = Depends(get_current_user)):
    """
    Step 1 of Twitter OAuth 1.0a: obtain a request token and return the
    authorization URL for the user to visit.
    """
    try:
        import tweepy
    except ImportError:
        raise HTTPException(status_code=500, detail="tweepy is not installed")

    api_key = os.getenv("TWITTER_API_KEY", "")
    api_secret = os.getenv("TWITTER_API_SECRET", "")
    callback_url = os.getenv(
        "TWITTER_REDIRECT_URI",
        "http://localhost:8000/api/v1/oauth/twitter/callback",
    )

    if not api_key or not api_secret:
        raise HTTPException(status_code=500, detail="TWITTER_API_KEY / TWITTER_API_SECRET not configured")

    auth = tweepy.OAuth1UserHandler(api_key, api_secret, callback=callback_url)
    try:
        redirect_url = auth.get_authorization_url()
    except tweepy.TweepyException as exc:
        raise HTTPException(status_code=502, detail=f"Twitter request-token failed: {exc}")

    # Store request token secret keyed by oauth_token
    request_token = auth.request_token
    _save_state(request_token["oauth_token"], {
        "user_id": current_user.id,
        "oauth_token_secret": request_token["oauth_token_secret"],
    })
    return {"authorize_url": redirect_url}


@router.get("/twitter/callback")
def twitter_callback(
    oauth_token: str = Query(...),
    oauth_verifier: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    Step 2 of Twitter OAuth 1.0a: exchange verifier for access token and
    save the account.
    """
    try:
        import tweepy
    except ImportError:
        raise HTTPException(status_code=500, detail="tweepy is not installed")

    state_data = _pop_state(oauth_token)
    if not state_data:
        raise HTTPException(status_code=400, detail="Invalid or expired Twitter OAuth state")

    user_id = state_data["user_id"]
    api_key = os.getenv("TWITTER_API_KEY", "")
    api_secret = os.getenv("TWITTER_API_SECRET", "")

    auth = tweepy.OAuth1UserHandler(api_key, api_secret)
    auth.request_token = {
        "oauth_token": oauth_token,
        "oauth_token_secret": state_data["oauth_token_secret"],
    }

    try:
        access_token, access_token_secret = auth.get_access_token(oauth_verifier)
    except tweepy.TweepyException as exc:
        raise HTTPException(status_code=502, detail=f"Twitter access-token exchange failed: {exc}")

    # Fetch Twitter user info
    api = tweepy.API(auth)
    twitter_user = api.verify_credentials()
    screen_name = twitter_user.screen_name
    user_id_str = str(twitter_user.id)

    # Store both tokens as JSON in access_token field
    combined = json.dumps({"oauth_token": access_token, "oauth_token_secret": access_token_secret})
    acct = _upsert_social_account(
        db,
        user_id=user_id,
        platform="twitter",
        account_name=f"@{screen_name}",
        platform_account_id=user_id_str,
        access_token=combined,
    )
    msg = f"Successfully connected X (Twitter) account '@{screen_name}'!"
    return _oauth_popup_response("connected", msg)


# ══════════════════════════════════════════════════════════════════════════════
# YOUTUBE / GOOGLE
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/youtube/authorize")
def youtube_authorize(current_user: User = Depends(get_current_user)):
    """Return the Google OAuth 2.0 authorization URL for YouTube access."""
    try:
        from google_auth_oauthlib.flow import Flow
    except ImportError:
        raise HTTPException(status_code=500, detail="google-auth-oauthlib is not installed")

    client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
    redirect_uri = os.getenv(
        "GOOGLE_REDIRECT_URI",
        "http://localhost:8000/api/v1/oauth/youtube/callback",
    )

    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not configured")

    scopes = [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.force-ssl",
        "https://www.googleapis.com/auth/userinfo.profile",
        "openid",
    ]

    flow = Flow.from_client_config(
        {"web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uris": [redirect_uri],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }},
        scopes=scopes,
        redirect_uri=redirect_uri,
    )

    state = secrets.token_urlsafe(32)
    _save_state(state, {"user_id": current_user.id})

    auth_url, _ = flow.authorization_url(
        access_type="offline",
        state=state,
        prompt="consent",
        include_granted_scopes="true",
    )
    return {"authorize_url": auth_url}


@router.get("/youtube/callback")
def youtube_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    """Exchange Google auth code for YouTube access/refresh tokens."""
    try:
        from google_auth_oauthlib.flow import Flow
        from googleapiclient.discovery import build
    except ImportError:
        raise HTTPException(status_code=500, detail="google-auth-oauthlib is not installed")

    state_data = _pop_state(state)
    if not state_data:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

    user_id = state_data["user_id"]
    client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
    redirect_uri = os.getenv(
        "GOOGLE_REDIRECT_URI",
        "http://localhost:8000/api/v1/oauth/youtube/callback",
    )

    scopes = [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.force-ssl",
        "https://www.googleapis.com/auth/userinfo.profile",
        "openid",
    ]

    flow = Flow.from_client_config(
        {"web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uris": [redirect_uri],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }},
        scopes=scopes,
        redirect_uri=redirect_uri,
        state=state,
    )

    flow.fetch_token(code=code)
    creds = flow.credentials

    # Get channel info
    youtube = build("youtube", "v3", credentials=creds, cache_discovery=False)
    channels_resp = youtube.channels().list(part="snippet", mine=True).execute()
    items = channels_resp.get("items", [])
    if items:
        channel = items[0]
        channel_id = channel["id"]
        channel_name = channel["snippet"]["title"]
    else:
        channel_id = "unknown"
        channel_name = "YouTube Channel"

    acct = _upsert_social_account(
        db,
        user_id=user_id,
        platform="youtube",
        account_name=channel_name,
        platform_account_id=channel_id,
        access_token=creds.token,
        refresh_token=creds.refresh_token,
    )
    msg = f"Successfully connected YouTube channel '{channel_name}'!"
    return _oauth_popup_response("connected", msg)
