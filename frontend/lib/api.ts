const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("sp_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Request failed");
  }
  if (res.status === 204) {
    return { success: true } as unknown as T;
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UserOut {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export async function apiRegister(payload: RegisterPayload): Promise<UserOut> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<UserOut>(res);
}

export async function apiLogin(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<TokenResponse>(res);
}

export async function apiGetMe(): Promise<UserOut> {
  const res = await fetch(`${BASE_URL}/api/v1/users/me`, { headers: authHeaders() });
  return handleResponse<UserOut>(res);
}

export async function apiChangePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/users/me/password`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Request failed");
  }
}

export async function apiListUsers(): Promise<UserOut[]> {
  const res = await fetch(`${BASE_URL}/api/v1/users/list`, { headers: authHeaders() });
  return handleResponse<UserOut[]>(res);
}

// ── Social Accounts ───────────────────────────────────────────────────────────

export interface SocialAccountPayload {
  platform: string;
  account_name: string;
  platform_account_id: string;
  access_token: string;
  refresh_token?: string | null;
  scopes?: string[];
  expires_at?: string | null;
}

export interface SocialAccountOut extends SocialAccountPayload {
  id: number;
  user_id: number;
  status: "connected" | "disconnected" | "expired" | string;
  updated_at?: string;
}

export interface OAuthUrlResponse {
  authorization_url?: string;
  authorize_url?: string;
  state?: string;
}

export async function apiListAccounts(): Promise<SocialAccountOut[]> {
  const res = await fetch(`${BASE_URL}/api/v1/accounts/list`, {
    headers: authHeaders(),
  });
  return handleResponse<SocialAccountOut[]>(res);
}

export async function apiConnectAccount(payload: SocialAccountPayload): Promise<SocialAccountOut> {
  const res = await fetch(`${BASE_URL}/api/v1/accounts/connect`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<SocialAccountOut>(res);
}

export async function apiDisconnectAccount(accountId: number): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${BASE_URL}/api/v1/accounts/${accountId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse<{ success: boolean; message?: string }>(res);
}

export async function apiRefreshToken(accountId: number): Promise<SocialAccountOut> {
  const res = await fetch(`${BASE_URL}/api/v1/accounts/${accountId}/refresh`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse<SocialAccountOut>(res);
}

export async function apiGetOAuthUrl(platform: string): Promise<OAuthUrlResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/oauth/${encodeURIComponent(platform)}/authorize`, {
    headers: authHeaders(),
  });
  const data = await handleResponse<any>(res);
  return {
    ...data,
    authorization_url: data.authorization_url || data.authorize_url,
    authorize_url: data.authorize_url || data.authorization_url,
  };
}

// ── Content (Posts & Drafts) ──────────────────────────────────────────────────

export interface ContentDraftOut {
  id: string;
  post_id: number;
  content_type: string;
  texts: Record<string, string>;
  selected_platforms: string[];
  hashtags: string[];
  campaign: string;
  media_refs: any[];
  metadata: any;
  updated_at: string;
}

export interface PostOut {
  id: number;
  user_id: number;
  content: string;
  platform: string;
  status: string;
  scheduled_time?: string | null;
  published_time?: string | null;
  media_urls?: string[];
  draft_metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface PostCreatePayload {
  content: string;
  platform: string;
  status: string;
  content_type?: string;
  social_account_id?: number;
  scheduled_time?: string | null;
  media_urls?: string[];
  draft_metadata?: any;
}

export interface PostUpdatePayload {
  content?: string;
  platform?: string;
  content_type?: string;
  status?: string;
  scheduled_time?: string | null;
  media_urls?: string[];
  draft_metadata?: any;
}

export async function apiCreatePost(payload: PostCreatePayload): Promise<PostOut> {
  const res = await fetch(`${BASE_URL}/api/v1/content/posts`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<PostOut>(res);
}

export async function apiListPosts(status?: string, platform?: string): Promise<PostOut[]> {
  const query = new URLSearchParams();
  if (status) query.append("status", status);
  if (platform) query.append("platform", platform);
  
  const res = await fetch(`${BASE_URL}/api/v1/content/posts?${query.toString()}`, {
    headers: authHeaders(),
  });
  return handleResponse<PostOut[]>(res);
}

export async function apiUpdatePost(id: number, payload: PostUpdatePayload): Promise<PostOut> {
  const res = await fetch(`${BASE_URL}/api/v1/content/posts/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<PostOut>(res);
}

export async function apiDeletePost(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE_URL}/api/v1/content/posts/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (res.status === 404 || res.status === 403 || res.status === 204 || res.ok) {
    return { success: true };
  }
  return handleResponse<{ success: boolean }>(res);
}

export async function apiListDrafts(): Promise<ContentDraftOut[]> {
  const res = await fetch(`${BASE_URL}/api/v1/content/drafts`, {
    headers: authHeaders(),
  });
  return handleResponse<ContentDraftOut[]>(res);
}

export async function apiListLogs(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/api/v1/content/logs`, {
    headers: authHeaders(),
  });
  return handleResponse<any[]>(res);
}

export async function apiListNotifications(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/api/v1/notifications`, {
    headers: authHeaders(),
  });
  return handleResponse<any[]>(res);
}

export async function apiUpdateNotification(id: number, is_read: boolean): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/v1/notifications/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ is_read })
  });
  return handleResponse<any>(res);
}

export async function apiDeleteNotification(id: number): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/v1/notifications/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
     throw new Error("Delete failed");
  }
  return true;
}

export async function apiListCampaigns(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/api/v1/campaigns`, {
    headers: authHeaders(),
  });
  return handleResponse<any[]>(res);
}

export async function apiListTeams(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/api/v1/teams`, {
    headers: authHeaders(),
  });
  return handleResponse<any[]>(res);
}

export async function apiGetDashboardAnalytics(): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/v1/analytics/dashboard`, {
    headers: authHeaders(),
  });
  return handleResponse<any>(res);
}

export async function apiListReports(): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/v1/reports`, {
    headers: authHeaders(),
  });
  return handleResponse<any>(res);
}

export async function apiListRecurringSchedules(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/api/v1/recurring`, {
    headers: authHeaders(),
  });
  return handleResponse<any[]>(res);
}

export async function apiCreateRecurringSchedule(data: any): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/v1/recurring`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse<any>(res);
}

export async function apiToggleRecurringSchedule(id: number): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/v1/recurring/${id}/toggle`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  return handleResponse<any>(res);
}

export async function apiDeleteRecurringSchedule(id: number): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/v1/recurring/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
     throw new Error("Delete failed");
  }
  return true;
}

// ── Publishing ────────────────────────────────────────────────────────────────

export interface PublishTaskResponse {
  message: string;
  task_id: string;
  status_url: string;
}

export interface PublishStatusResponse {
  task_id: string;
  state: string;
  result?: any;
  error?: string;
  info?: any;
}

export async function apiQueuePublish(postId: number): Promise<PublishTaskResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/publish/${postId}`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse<PublishTaskResponse>(res);
}

export async function apiCheckPublishStatus(taskId: string): Promise<PublishStatusResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/publish/status/${taskId}`, {
    headers: authHeaders(),
  });
  return handleResponse<PublishStatusResponse>(res);
}

// ── Media / S3 ────────────────────────────────────────────────────────────────

export interface UploadMediaResponse {
  urls: string[];
  count: number;
}

/**
 * Upload one or more media files to AWS S3 via the backend.
 * Returns an array of public S3 URLs.
 *
 * @param files       Raw File objects from a file input or drag-drop
 * @param contentType Post content category: image | video | carousel | story | reel | media
 */
export async function apiUploadMedia(
  files: File[],
  contentType: string = "media"
): Promise<string[]> {
  const token = typeof window !== "undefined" ? localStorage.getItem("sp_token") : null;

  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }
  form.append("content_type", contentType.toLowerCase());

  const res = await fetch(`${BASE_URL}/api/v1/media/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const data = await handleResponse<UploadMediaResponse>(res);
  return data.urls;
}

/**
 * Delete S3 media objects by their public URLs.
 * Call this before deleting a post to avoid orphaned S3 files.
 */
export async function apiDeleteMedia(urls: string[]): Promise<void> {
  if (!urls || urls.length === 0) return;
  const res = await fetch(`${BASE_URL}/api/v1/media/delete`, {
    method: "DELETE",
    headers: authHeaders(),
    body: JSON.stringify({ urls }),
  });
  await handleResponse<{ deleted: number }>(res);
}

// ── Reports & Campaigns Metrics ────────────────────────────────────────────────

export async function apiGetCampaignMetrics(campaignId: number): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/v1/campaigns/${campaignId}/metrics`, {
    headers: authHeaders(),
  });
  return handleResponse<any>(res);
}

export async function apiCreateCampaign(payload: {
  name: string;
  description?: string;
  objective?: string;
  status?: string;
  platforms?: string;
  budget?: string;
  start_date?: string | null;
  end_date?: string | null;
  progress?: number;
}): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/v1/campaigns`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<any>(res);
}

export async function apiGetPlatformStats(): Promise<{ platforms: any[] }> {
  const res = await fetch(`${BASE_URL}/api/v1/analytics/platform-stats`, {
    headers: authHeaders(),
  });
  return handleResponse<{ platforms: any[] }>(res);
}

