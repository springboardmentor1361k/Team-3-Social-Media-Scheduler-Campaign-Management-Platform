"use client";

import { useSyncExternalStore } from "react";

export type Platform = "X" | "Instagram" | "LinkedIn" | "Facebook" | "YouTube" | "Pinterest";
export type ContentType = "Text" | "Image" | "Video" | "Carousel" | "Story" | "Reel";
export type PostStatus = "Published" | "Scheduled" | "Draft" | "Failed" | "Cancelled";
export type RecurrenceFrequency = "Daily" | "Weekly" | "Bi-weekly" | "Monthly" | "Custom";

export interface PostMedia {
  name: string;
  type: "image" | "video";
  url: string;
  size: number;
}

export interface SocialPost {
  id: string;
  content: string;
  contentType: ContentType;
  platform: Platform;
  campaign: string;
  category?: string;
  approvalStatus?: "Draft" | "Needs Review" | "Approved";
  hashtags: string[];
  status: PostStatus;
  scheduledAt: string | null;
  recurring: boolean;
  recurringType?: "Weekly" | "Monthly" | "Yearly" | "Daily";
  createdAt: string;
  media?: PostMedia[];
  errorMessage?: string;
  retryCount?: number;
  excludedOccurrences?: string[];
}

export interface SocialPostOccurrence extends SocialPost {
  isRecurringOccurrence?: boolean;
  occurrenceIndex?: number;
  originalPostId?: string;
}

export interface RecurringSchedule {
  id: string;
  title: string;
  content: string;
  contentType: ContentType;
  platforms: Platform[];
  frequency: RecurrenceFrequency;
  daysOfWeek: string[]; // e.g. ["Mon", "Wed", "Fri"]
  timeSlot: string; // e.g. "09:00"
  endCondition: "Never" | "AfterCount" | "OnDate";
  endCount?: number;
  endDate?: string;
  active: boolean;
  publishedCount: number;
  nextRunAt: string;
  createdAt: string;
  campaign?: string;
  hashtags?: string[];
}

export interface PublishingLog {
  id: string;
  postId: string;
  platform: Platform;
  content: string;
  status: PostStatus;
  timestamp: string;
  statusCode?: number;
  endpoint?: string;
  errorMessage?: string;
  retryCount: number;
  accountHandle: string;
  campaign?: string;
}

const now = new Date();

const initialPosts: SocialPost[] = [
  {
    id: "post-1",
    content: "🚀 Exciting news! Our new AI-powered Analytics Dashboard is officially live. Track engagement, reach, and conversion metrics in real-time across all your social channels. Link in bio!",
    contentType: "Image",
    platform: "LinkedIn",
    campaign: "Q3 Feature Release",
    hashtags: ["ProductUpdate", "SaaS", "Analytics", "Growth"],
    status: "Scheduled",
    scheduledAt: new Date(now.getTime() + 1000 * 60 * 60 * 5).toISOString(),
    recurring: false,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
    media: [{ name: "dashboard-preview.png", type: "image", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop", size: 1240000 }],
  },
  {
    id: "post-2",
    content: "5 proven strategies to boost your Instagram engagement rate by 200% this month. Swipe to read our step-by-step breakdown! 📈✨",
    contentType: "Carousel",
    platform: "Instagram",
    campaign: "Social Tips 2026",
    hashtags: ["SocialMediaTips", "InstagramGrowth", "DigitalMarketing"],
    status: "Scheduled",
    scheduledAt: new Date(now.getTime() + 1000 * 60 * 60 * 28).toISOString(),
    recurring: true,
    recurringType: "Weekly",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString(),
    media: [
      { name: "slide1.jpg", type: "image", url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop", size: 850000 },
      { name: "slide2.jpg", type: "image", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop", size: 920000 }
    ],
  },
  {
    id: "post-3",
    content: "Behind the scenes at SocialPilot HQ! Quick sneak peek of our team building the next generation of social media workflows. 💻🔥",
    contentType: "Video",
    platform: "X",
    campaign: "Brand Culture",
    hashtags: ["BuildInPublic", "TechTeam", "StartupLife"],
    status: "Published",
    scheduledAt: new Date(now.getTime() - 1000 * 60 * 60 * 18).toISOString(),
    recurring: false,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "post-4",
    content: "Draft Idea: Complete guide on multi-channel content repurposing. Convert 1 blog post into 10 social snippets.",
    contentType: "Text",
    platform: "X",
    campaign: "Content Strategy",
    category: "Blog Snippet",
    approvalStatus: "Draft",
    hashtags: ["ContentMarketing", "Productivity"],
    status: "Draft",
    scheduledAt: null,
    recurring: false,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: "post-5",
    content: "Infographic Draft: 2026 Social Media Benchmarks for SaaS & E-commerce Brands. Needs design approval before scheduling.",
    contentType: "Image",
    platform: "Facebook",
    campaign: "Industry Insights",
    category: "Tech Tip",
    approvalStatus: "Needs Review",
    hashtags: ["SaaSBenchmarks", "Ecommerce", "Data"],
    status: "Draft",
    scheduledAt: null,
    recurring: false,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
    media: [{ name: "benchmarks-draft.jpg", type: "image", url: "https://images.unsplash.com/photo-1542744094-3a3172720180?w=800&auto=format&fit=crop", size: 1420000 }],
  },
  {
    id: "post-8",
    content: "Drafting our next big product feature reveal! We are bringing collaborative drafts and multi-network approvals directly to SocialPilot. 🚀",
    contentType: "Text",
    platform: "LinkedIn",
    campaign: "Q3 Feature Release",
    category: "Product Announcement",
    approvalStatus: "Approved",
    hashtags: ["SaaS", "ProductUpdate", "SocialPilot"],
    status: "Draft",
    scheduledAt: null,
    recurring: false,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "post-9",
    content: "Instagram Reels Tip: Use trending audio tracks and high-contrast text overlays to grab viewer attention in the first 3 seconds! 🎥📈",
    contentType: "Text",
    platform: "Instagram",
    campaign: "Social Tips 2026",
    category: "Tech Tip",
    approvalStatus: "Needs Review",
    hashtags: ["ReelsGrowth", "InstagramMarketing", "TechTip"],
    status: "Draft",
    scheduledAt: null,
    recurring: false,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "post-6",
    content: "Weekly Product Spotlight: Master post scheduling in under 2 minutes with SocialPilot calendar drag-and-drop. ⚡",
    contentType: "Video",
    platform: "YouTube",
    campaign: "Product Demos",
    hashtags: ["ProductDemo", "SocialPilot", "Tutorial"],
    status: "Scheduled",
    scheduledAt: new Date(now.getTime() + 1000 * 60 * 60 * 72).toISOString(),
    recurring: true,
    recurringType: "Weekly",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 10).toISOString(),
  },
  {
    id: "post-7",
    content: "API rate limit reached while attempting auto-publishing. Click retry to republish immediately.",
    contentType: "Text",
    platform: "Pinterest",
    campaign: "Visual Inspiration",
    hashtags: ["Design", "Inspiration"],
    status: "Failed",
    scheduledAt: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(),
    recurring: false,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
    errorMessage: "OAuth Token Expired or API Rate Limit (429)",
    retryCount: 2,
  }
];

const initialSchedules: RecurringSchedule[] = [
  {
    id: "rec-1",
    title: "Weekly Tech Tips & Tricks",
    content: "💡 Weekly Tech Tip: Always optimize your image metadata before sharing across social channels to increase discoverability! #TechTip #SocialMedia",
    contentType: "Text",
    platforms: ["X", "LinkedIn", "Facebook"],
    frequency: "Weekly",
    daysOfWeek: ["Mon", "Wed"],
    timeSlot: "09:00",
    endCondition: "Never",
    active: true,
    publishedCount: 14,
    nextRunAt: new Date(now.getTime() + 1000 * 60 * 60 * 18).toISOString(),
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    campaign: "Weekly Engagement",
    hashtags: ["TechTip", "SocialMedia", "Marketing"],
  },
  {
    id: "rec-2",
    title: "Monthly Community Showcase",
    content: "🌟 Community Spotlight: Shoutout to our creator of the month! Thanks for creating amazing content with SocialPilot. 🎉 #CommunitySpotlight",
    contentType: "Image",
    platforms: ["Instagram", "LinkedIn"],
    frequency: "Monthly",
    daysOfWeek: ["Fri"],
    timeSlot: "14:00",
    endCondition: "AfterCount",
    endCount: 12,
    active: true,
    publishedCount: 4,
    nextRunAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 12).toISOString(),
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    campaign: "Community First",
    hashtags: ["CreatorEconomy", "Community"],
  },
];

const STORAGE_KEY = "sp_posts";
const RECURRING_KEY = "sp_recurring_schedules";

function loadPosts(): SocialPost[] {
  if (typeof window === "undefined") return initialPosts;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialPosts;
    const parsed = JSON.parse(saved) as SocialPost[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      const parsedIds = new Set(parsed.map((p) => p.id));
      const missing = initialPosts.filter((p) => !parsedIds.has(p.id));
      if (missing.length > 0) {
        const merged = [...parsed, ...missing];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    }
    return initialPosts;
  } catch {
    return initialPosts;
  }
}

function loadSchedules(): RecurringSchedule[] {
  if (typeof window === "undefined") return initialSchedules;
  try {
    const saved = localStorage.getItem(RECURRING_KEY);
    if (!saved) return initialSchedules;
    const parsed = JSON.parse(saved) as RecurringSchedule[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialSchedules;
  } catch {
    return initialSchedules;
  }
}

let posts: SocialPost[] = loadPosts();
let recurringSchedules: RecurringSchedule[] = loadSchedules();

const listeners = new Set<() => void>();

function notify() { listeners.forEach((l) => l()); }

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    localStorage.setItem(RECURRING_KEY, JSON.stringify(recurringSchedules));
  } catch {}
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const targetMonth = d.getMonth() + months;
  d.setMonth(targetMonth);
  if (d.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    d.setDate(0);
  }
  return d;
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  const targetYear = d.getFullYear() + years;
  d.setFullYear(targetYear);
  if (date.getMonth() === 1 && date.getDate() === 29 && d.getMonth() !== 1) {
    d.setDate(0);
  }
  return d;
}

export function getExpandedPosts(postsList: SocialPost[]): SocialPostOccurrence[] {
  const expanded: SocialPostOccurrence[] = [];

  for (const post of postsList) {
    expanded.push(post);

    if (post.recurring && post.recurringType && post.scheduledAt && (post.status === "Scheduled" || post.status === "Published")) {
      const baseDate = new Date(post.scheduledAt);
      if (Number.isNaN(baseDate.getTime())) continue;

      const count = post.recurringType === "Daily" ? 30 : post.recurringType === "Weekly" ? 26 : post.recurringType === "Monthly" ? 12 : 5;

      for (let i = 1; i <= count; i++) {
        let nextDate: Date;
        if (post.recurringType === "Daily") {
          nextDate = new Date(baseDate);
          nextDate.setDate(baseDate.getDate() + i);
        } else if (post.recurringType === "Weekly") {
          nextDate = new Date(baseDate);
          nextDate.setDate(baseDate.getDate() + i * 7);
        } else if (post.recurringType === "Monthly") {
          nextDate = addMonths(baseDate, i);
        } else {
          nextDate = addYears(baseDate, i);
        }

        const occId = `${post.id}-occ-${i}`;
        if (post.excludedOccurrences?.includes(occId)) continue;

        expanded.push({
          ...post,
          id: occId,
          scheduledAt: nextDate.toISOString(),
          isRecurringOccurrence: true,
          occurrenceIndex: i + 1,
          originalPostId: post.id,
        });
      }
    }
  }

  return expanded;
}

export function addPosts(newPosts: SocialPost[]) {
  posts = [...newPosts, ...posts];
  persist();
  notify();
}

export function updatePost(updated: SocialPost) {
  const targetId = updated.id.includes("-occ-") ? updated.id.split("-occ-")[0] : updated.id;
  posts = posts.map((p) => (p.id === targetId ? { ...updated, id: targetId } : p));
  persist();
  notify();
}

export function deletePost(id: string) {
  if (id.includes("-occ-")) {
    const baseId = id.split("-occ-")[0];
    posts = posts.map((p) => {
      if (p.id === baseId) {
        const excluded = p.excludedOccurrences ?? [];
        return { ...p, excludedOccurrences: [...excluded, id] };
      }
      return p;
    });
  } else {
    posts = posts.filter((p) => p.id !== id);
  }
  persist();
  notify();
}

export function updatePostStatus(id: string, status: PostStatus) {
  const targetId = id.includes("-occ-") ? id.split("-occ-")[0] : id;
  posts = posts.map((p) =>
    p.id === targetId
      ? {
          ...p,
          status,
          scheduledAt: status === "Published" ? new Date().toISOString() : p.scheduledAt,
          errorMessage: status !== "Failed" ? undefined : p.errorMessage,
        }
      : p,
  );
  persist();
  notify();
}

export function scheduleDraft(id: string, scheduledAt: string) {
  posts = posts.map((p) =>
    p.id === id ? { ...p, status: "Scheduled", scheduledAt } : p
  );
  persist();
  notify();
}

export function addRecurringSchedule(schedule: RecurringSchedule) {
  recurringSchedules = [schedule, ...recurringSchedules];
  persist();
  notify();
}

export function toggleRecurringSchedule(id: string) {
  recurringSchedules = recurringSchedules.map((s) =>
    s.id === id ? { ...s, active: !s.active } : s
  );
  persist();
  notify();
}

export function deleteRecurringSchedule(id: string) {
  recurringSchedules = recurringSchedules.filter((s) => s.id !== id);
  persist();
  notify();
}

export function bulkDeletePosts(ids: string[]) {
  const set = new Set(ids);
  posts = posts.filter((p) => !set.has(p.id));
  persist();
  notify();
}

export function bulkScheduleDrafts(ids: string[], scheduledAt: string) {
  const set = new Set(ids);
  posts = posts.map((p) =>
    set.has(p.id) ? { ...p, status: "Scheduled", scheduledAt } : p
  );
  persist();
  notify();
}

export function retryAllFailedPosts() {
  posts = posts.map((p) =>
    p.status === "Failed"
      ? { ...p, status: "Scheduled", errorMessage: undefined, retryCount: (p.retryCount || 0) + 1 }
      : p
  );
  persist();
  notify();
}

export function retrySinglePost(id: string) {
  const targetId = id.includes("-occ-") ? id.split("-occ-")[0] : id;
  posts = posts.map((p) =>
    p.id === targetId
      ? { ...p, status: "Scheduled", errorMessage: undefined, retryCount: (p.retryCount || 0) + 1 }
      : p
  );
  persist();
  notify();
}

export function cancelScheduledPost(id: string) {
  const targetId = id.includes("-occ-") ? id.split("-occ-")[0] : id;
  posts = posts.map((p) =>
    p.id === targetId ? { ...p, status: "Cancelled" } : p
  );
  persist();
  notify();
}

export function shiftScheduledPosts(daysDelta: number) {
  const msDelta = daysDelta * 24 * 60 * 60 * 1000;
  posts = posts.map((p) => {
    if (p.status === "Scheduled" && p.scheduledAt) {
      const d = new Date(p.scheduledAt);
      return { ...p, scheduledAt: new Date(d.getTime() + msDelta).toISOString() };
    }
    return p;
  });
  persist();
  notify();
}

export function formatDateKey(input: Date | string) {
  const date = typeof input === "string" ? new Date(input) : input;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function usePosts() {
  const currentPosts = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => posts,
    () => posts,
  );

  const currentSchedules = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => recurringSchedules,
    () => recurringSchedules,
  );

  return {
    posts: currentPosts,
    recurringSchedules: currentSchedules,
    addPosts,
    updatePost,
    deletePost,
    updatePostStatus,
    scheduleDraft,
    addRecurringSchedule,
    toggleRecurringSchedule,
    deleteRecurringSchedule,
    bulkDeletePosts,
    bulkScheduleDrafts,
    retryAllFailedPosts,
    retrySinglePost,
    cancelScheduledPost,
    shiftScheduledPosts,
  };
}
