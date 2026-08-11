"use client";

import { useSyncExternalStore } from "react";

export type UserRole = "Admin" | "Content Creator" | "Marketing Team" | "Business User";

export const ALL_ROLES: UserRole[] = ["Admin", "Content Creator", "Marketing Team", "Business User"];

export const ROLE_PAGES: Record<UserRole, string[]> = {
  "Admin": [
    "dashboard", "users", "teams", "campaigns", "reports",
    "analytics", "notifications", "profile", "accounts", "create", "calendar", "drafts", "publishing-logs",
  ],
  "Content Creator": [
    "dashboard", "create", "calendar", "drafts", "accounts", "profile", "notifications", "publishing-logs",
  ],
  "Marketing Team": [
    "dashboard", "campaigns", "analytics", "reports", "accounts", "notifications", "profile", "calendar", "drafts", "publishing-logs",
  ],
  "Business User": [
    "dashboard", "campaigns", "analytics", "reports", "profile", "notifications", "calendar", "drafts", "publishing-logs",
  ],
};

function getInitialRole(): UserRole {
  if (typeof window === "undefined") return "Content Creator";
  try {
    // Derive role from JWT — single source of truth
    const token = localStorage.getItem("sp_token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const mapped = ROLE_MAP[payload.role as string];
      if (mapped) return mapped as UserRole;
    }
  } catch {}
  return "Content Creator";
}

const ROLE_MAP: Record<string, string> = {
  administrator:   "Admin",
  content_creator: "Content Creator",
  marketing_team:  "Marketing Team",
  business_user:   "Business User",
};

let activeRole: UserRole = getInitialRole();
const listeners = new Set<() => void>();

function notify() { listeners.forEach((l) => l()); }

// Called once after login to sync role from JWT
export function setRole(role: UserRole) {
  activeRole = role;
  notify();
}

export function getRole(): UserRole { return activeRole; }

export function useRole(): UserRole {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => activeRole,
    () => "Admin",
  );
}

export function hasAccess(role: UserRole, view: string): boolean {
  return ROLE_PAGES[role]?.includes(view) ?? false;
}

export function roleColor(role: UserRole): string {
  switch (role) {
    case "Admin":           return "from-red-500 to-rose-600";
    case "Content Creator": return "from-violet-500 to-purple-600";
    case "Marketing Team":  return "from-blue-500 to-indigo-600";
    case "Business User":   return "from-emerald-500 to-teal-600";
  }
}

export function roleBadgeColor(role: UserRole): string {
  switch (role) {
    case "Admin":           return "bg-red-500/15 text-red-400 border-red-500/25";
    case "Content Creator": return "bg-violet-500/15 text-violet-400 border-violet-500/25";
    case "Marketing Team":  return "bg-blue-500/15 text-blue-400 border-blue-500/25";
    case "Business User":   return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
  }
}
