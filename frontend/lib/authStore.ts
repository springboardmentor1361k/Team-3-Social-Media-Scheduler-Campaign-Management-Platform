"use client";

export interface JWTPayload {
  sub: string;   // email
  role: string;
  user_id: number;
  exp: number;
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload)) as JWTPayload;
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  localStorage.setItem("sp_token", token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sp_token");
}

export function clearToken() {
  localStorage.removeItem("sp_token");
  localStorage.removeItem("sp_active_role");
}

export function getUser(): JWTPayload | null {
  const token = getToken();
  if (!token) return null;
  return decodeJWT(token);
}

// Maps backend role values to frontend UserRole labels
const ROLE_MAP: Record<string, string> = {
  administrator:    "Admin",
  content_creator:  "Content Creator",
  marketing_team:   "Marketing Team",
  business_user:    "Business User",
};

export function getFrontendRole(backendRole: string): string {
  return ROLE_MAP[backendRole] ?? "Content Creator";
}
