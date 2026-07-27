"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Plus,
  Trash2,
  X,
  Globe,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaPinterest,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import {
  Platform,
  SocialPost,
  SocialPostOccurrence,
  getExpandedPosts,
  formatDateKey,
  PostStatus
} from "@/lib/postStore";
import { apiListPosts, apiUpdatePost, apiDeletePost, apiQueuePublish } from "@/lib/api";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const platformIcons = {
  X: { icon: FaTwitter, color: "text-white" },
  Instagram: { icon: FaInstagram, color: "text-[#e4405f]" },
  LinkedIn: { icon: FaLinkedin, color: "text-[#0077b5]" },
  Facebook: { icon: FaFacebook, color: "text-[#1877f2]" },
  YouTube: { icon: FaYoutube, color: "text-[#ff0000]" },
  Pinterest: { icon: FaPinterest, color: "text-[#bd081c]" },
};

type CalendarMode = "Month" | "Week" | "Day" | "Queue";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(left: Date, right: Date) {
  return formatDateKey(left) === formatDateKey(right);
}

function postDate(post: SocialPost) {
  return post.scheduledAt ? new Date(post.scheduledAt) : new Date(post.createdAt);
}

function statusClasses(status: SocialPost["status"]) {
  if (status === "Published") return "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
  if (status === "Draft") return "text-white/50 bg-white/5 border border-white/10";
  if (status === "Failed") return "text-rose-400 bg-rose-500/10 border border-rose-500/20";
  return "text-violet-400 bg-violet-500/10 border border-violet-500/20";
}

export default function CalendarView() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(startOfDay(new Date()));
  const [platformFilter, setPlatformFilter] = useState<"All" | Platform>("All");
  const [mode, setMode] = useState<CalendarMode>("Month");
  const [previewPost, setPreviewPost] = useState<SocialPost | null>(null);
  const [draggedOverDate, setDraggedOverDate] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      const data = await apiListPosts();
      const mapped: SocialPost[] = data.map(p => {
        // Normalize status from backend lowercase → frontend capitalized PostStatus
        const rawStatus = (p.status || "draft");
        const status = (rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1)) as PostStatus;
        return {
          id: p.id.toString(),
          content: p.content,
          contentType: (p.draft_metadata?.contentType || "Text") as any,
          platform: p.platform as Platform,
          status,
          scheduledAt: p.scheduled_time || null,
          createdAt: p.created_at,
          media: p.media_urls?.map(url => ({ url, type: 'image' as const, name: "media", size: 0 })) || [],
          campaign: p.draft_metadata?.campaign || "General",
          hashtags: p.draft_metadata?.hashtags || [],
          recurring: p.draft_metadata?.recurring || false,
        };
      });
      setPosts(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchPosts().then(() => { if (!isMounted) return; });
    return () => { isMounted = false; };
  }, []);

  const deletePost = async (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    try {
      await apiDeletePost(Number(id));
    } catch (e) {
      console.error("Failed to delete post from calendar:", e);
    } finally {
      fetchPosts();
    }
  };

  const updatePostStatus = async (id: string, status: PostStatus) => {
    try {
      if (status === "Published") {
        // Find the post to check its current status before trying to publish
        const post = posts.find(p => p.id === id);
        if (post?.status === "Published") {
          // Already published — just refresh the view, don't re-publish
          fetchPosts();
          return;
        }
        await apiQueuePublish(Number(id));
      }
      await apiUpdatePost(Number(id), { status: status.toLowerCase() });
      fetchPosts();
    } catch (err: any) {
      console.error(`Failed to update post ${id} status:`, err?.message || err);
      fetchPosts(); // still refresh so UI reflects real state
    }
  };

  const updatePost = async (id: string, updates: { scheduledAt?: string, status?: PostStatus }) => {
    const payload: any = {};
    if (updates.scheduledAt !== undefined) payload.scheduled_time = updates.scheduledAt;
    if (updates.status !== undefined) payload.status = updates.status.toLowerCase();
    await apiUpdatePost(Number(id), payload);
    fetchPosts();
  };

  const retryAllFailedPosts = async () => {
    const failed = posts.filter(p => p.status === "Failed");
    for (const p of failed) {
      await updatePostStatus(p.id, "Scheduled");
    }
  };

  const allPosts = useMemo(() => getExpandedPosts(posts), [posts]);

  const filteredPosts = useMemo(
    () =>
      platformFilter === "All"
        ? allPosts
        : allPosts.filter((post) => post.platform === platformFilter),
    [platformFilter, allPosts],
  );

  const counts = useMemo(
    () => ({
      scheduled: filteredPosts.filter((post) => post.status === "Scheduled").length,
      published: filteredPosts.filter((post) => post.status === "Published").length,
      drafts: filteredPosts.filter((post) => post.status === "Draft").length,
      failed: filteredPosts.filter((post) => post.status === "Failed").length,
    }),
    [filteredPosts],
  );

  // Posts for the single selected day
  const selectedDatePosts = useMemo(
    () =>
      filteredPosts
        .filter((post) => post.scheduledAt && sameDay(postDate(post), selectedDate))
        .sort((left, right) => postDate(left).getTime() - postDate(right).getTime()),
    [filteredPosts, selectedDate],
  );

  // Posts for the entire week of the selected date
  const weekPosts = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - selectedDate.getDay());
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return filteredPosts
      .filter((post) => {
        if (!post.scheduledAt) return false;
        const pDate = new Date(post.scheduledAt);
        return pDate >= start && pDate <= end;
      })
      .sort((left, right) => postDate(left).getTime() - postDate(right).getTime());
  }, [filteredPosts, selectedDate]);

  // All queued posts (Scheduled + Failed, sorted chronologically)
  const queuePosts = useMemo(
    () =>
      filteredPosts
        .filter((post) => post.status === "Scheduled" || post.status === "Failed")
        .sort((left, right) => {
          const leftDate = left.scheduledAt ? postDate(left).getTime() : Number.MAX_SAFE_INTEGER;
          const rightDate = right.scheduledAt ? postDate(right).getTime() : Number.MAX_SAFE_INTEGER;
          return leftDate - rightDate;
        }),
    [filteredPosts],
  );

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const start = new Date(year, month, 1 - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const dayPosts = filteredPosts.filter((post) => post.scheduledAt && sameDay(postDate(post), date));
      return {
        date,
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isSelected: sameDay(date, selectedDate),
        isToday: sameDay(date, new Date()),
        scheduledCount: dayPosts.filter((post) => post.status === "Scheduled").length,
        publishedCount: dayPosts.filter((post) => post.status === "Published").length,
        failedCount: dayPosts.filter((post) => post.status === "Failed").length,
        hasRecurring: dayPosts.some((post) => post.recurring),
      };
    });
  }, [filteredPosts, selectedDate, visibleMonth]);

  // Navigation Logic based on Mode
  const navigatePrevious = () => {
    if (mode === "Month") {
      setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
    } else if (mode === "Week") {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 7);
      setSelectedDate(d);
      setVisibleMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    } else if (mode === "Day") {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      setSelectedDate(d);
      setVisibleMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  const navigateNext = () => {
    if (mode === "Month") {
      setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
    } else if (mode === "Week") {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 7);
      setSelectedDate(d);
      setVisibleMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    } else if (mode === "Day") {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      setSelectedDate(d);
      setVisibleMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  const handleTodayClick = () => {
    const today = startOfDay(new Date());
    setSelectedDate(today);
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Header Title Text generator
  const headerTitle = useMemo(() => {
    if (mode === "Month") {
      return monthFormatter.format(visibleMonth);
    }
    if (mode === "Week") {
      const start = new Date(selectedDate);
      start.setDate(selectedDate.getDate() - selectedDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      const startFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
      const endFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
      return `${startFormatter.format(start)} - ${endFormatter.format(end)}`;
    }
    if (mode === "Day") {
      return dateFormatter.format(selectedDate);
    }
    return "All Queued Posts";
  }, [mode, visibleMonth, selectedDate]);

  const sidePosts = mode === "Queue" ? queuePosts : selectedDatePosts;
  const listPosts = mode === "Queue" ? queuePosts : (mode === "Week" ? weekPosts : selectedDatePosts);

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-0 bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar flex flex-col min-w-0">
        {/* Failed Post Alert Banner if any failed posts exist */}
        {counts.failed > 0 && (
          <div className="mb-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-rose-300">
            <div className="flex items-center gap-2 text-xs font-bold min-w-0">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="truncate">{counts.failed} post(s) failed to auto-publish.</span>
            </div>
            <button
              type="button"
              onClick={retryAllFailedPosts}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Failed
            </button>
          </div>
        )}

        {/* Counts & Controls Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-semibold text-violet-400">
              {counts.scheduled} <span className="text-white/40 font-normal">Scheduled</span>
            </span>
            <span className="font-semibold text-emerald-400">
              {counts.published} <span className="text-white/40 font-normal">Published</span>
            </span>
            <span className="font-semibold text-white/70">
              {counts.drafts} <span className="text-white/40 font-normal">Drafts</span>
            </span>
            {counts.failed > 0 && (
              <span className="font-semibold text-rose-400">
                {counts.failed} <span className="text-white/40 font-normal">Failed</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={platformFilter}
              onChange={(event) => setPlatformFilter(event.target.value as "All" | Platform)}
              className="px-3.5 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-white cursor-pointer"
            >
              <option value="All" className="bg-[#05030e] text-white">All Platforms</option>
              {Object.keys(platformIcons).map((platform) => (
                <option key={platform} value={platform} className="bg-[#05030e] text-white">
                  {platform}
                </option>
              ))}
            </select>

            <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-lg">
              {(["Month", "Week", "Day", "Queue"] as CalendarMode[]).map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setMode(item)}
                  className={`px-3 md:px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    mode === item
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-white/40 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Header & Navigation */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight">{headerTitle}</h2>
          
          {mode !== "Queue" && (
            <div className="flex items-center gap-2 animate-fade-in">
              <button
                type="button"
                onClick={navigatePrevious}
                className="p-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-white/60" />
              </button>
              <button
                type="button"
                onClick={handleTodayClick}
                className="px-4 py-2 border border-white/10 rounded-lg text-sm font-semibold text-white/70 hover:bg-white/5 transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={navigateNext}
                className="p-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-white/60" />
              </button>
            </div>
          )}
        </div>

        {/* Main Calendar View Area */}
        {mode === "Month" && (
          <div className="flex-1 flex flex-col min-w-0 select-none">
            <div className="grid grid-cols-7 mb-2">
              {days.map((day) => (
                <div key={day} className="text-center text-xs font-bold text-white/40 uppercase tracking-wider py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="flex-1 grid grid-cols-7 gap-px bg-white/10 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
              {calendarDays.map((day) => {
                const dayKey = day.date.toISOString();
                const isDraggedOver = draggedOverDate === dayKey;

                return (
                  <div
                    key={dayKey}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDragEnter={() => setDraggedOverDate(dayKey)}
                    onDragLeave={() => setDraggedOverDate(null)}
                    onDrop={(e) => {
                      setDraggedOverDate(null);
                      const postId = e.dataTransfer.getData("text/plain");
                      if (!postId) return;

                      const post = posts.find((p) => p.id === postId);
                      if (!post) return;

                      // Maintain the time slot, only move date
                      const targetDate = new Date(day.date);
                      if (post.scheduledAt) {
                        const orig = new Date(post.scheduledAt);
                        targetDate.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
                      } else {
                        targetDate.setHours(10, 0, 0, 0);
                      }

                      updatePost(post.id, {
                        status: "Scheduled",
                        scheduledAt: targetDate.toISOString(),
                      });
                    }}
                    className={`min-h-[92px] w-full text-left p-2 transition-all relative ${
                      isDraggedOver
                        ? "bg-emerald-500/10 ring-2 ring-emerald-500 z-20"
                        : "bg-[#05030e]/40"
                    } ${
                      day.isSelected
                        ? "ring-2 ring-violet-500 bg-white/5 ring-inset z-10"
                        : "hover:bg-white/5"
                    } ${day.isCurrentMonth ? "" : "opacity-35"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedDate(startOfDay(day.date))}
                      className="w-full h-full text-left flex flex-col items-center justify-between focus:outline-none cursor-pointer"
                    >
                      <span
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold mb-1 ${
                          day.isSelected
                            ? "bg-violet-600 text-white"
                            : day.isToday
                              ? "bg-violet-500/20 text-violet-300"
                              : "text-white/75"
                        }`}
                      >
                        {day.day}
                      </span>

                      <div className="flex items-center gap-1 mt-auto pb-1 flex-wrap">
                        {day.scheduledCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 border border-violet-500/30 font-bold flex items-center gap-0.5">
                            {day.hasRecurring && <span title="Contains recurring post">🔄</span>}
                            {day.scheduledCount}
                          </span>
                        )}
                        {day.publishedCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                            {day.publishedCount}
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {mode !== "Month" && (
          <div className="grid gap-3 w-full min-w-0">
            {listPosts.map((post) => (
              <PostRow
                key={post.id}
                post={post}
                onPreview={() => setPreviewPost(post)}
                onDelete={() => deletePost(post.id)}
                onPublish={() => updatePostStatus(post.id, "Published")}
              />
            ))}
            {listPosts.length === 0 && (
              <EmptyState mode={mode} />
            )}
          </div>
        )}
      </div>

      {/* Right Sidebar Queue Area */}
      <aside className="w-full lg:w-[360px] shrink-0 bg-white/5 backdrop-blur-2xl border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-2">
            <h3 className="text-lg font-black text-white tracking-tight truncate">
              {mode === "Queue" ? "Content Queue" : dateFormatter.format(selectedDate)}
            </h3>
            <p className="text-xs text-white/40 font-semibold mt-0.5">{sidePosts.length} posts listed</p>
          </div>
          <Link
            href="/create"
            className="w-9 h-9 bg-violet-600 text-white rounded-full flex items-center justify-center hover:bg-violet-500 shadow-lg shadow-violet-500/25 transition-all shrink-0"
          >
            <Plus className="w-5 h-5" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar min-w-0">
          {sidePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPreview={() => setPreviewPost(post)}
              onDelete={() => deletePost(post.id)}
              onPublish={() => updatePostStatus(post.id, "Published")}
            />
          ))}
          {sidePosts.length === 0 && <EmptyState mode={mode} />}
        </div>
      </aside>

      {previewPost && <PreviewModal post={previewPost} onClose={() => setPreviewPost(null)} />}
    </div>
  );
}

function PostRow({
  post,
  onPreview,
  onDelete,
  onPublish,
}: {
  post: SocialPost;
  onPreview: () => void;
  onDelete: () => void;
  onPublish: () => void;
}) {
  const { icon: Icon, color } = platformIcons[post.platform as keyof typeof platformIcons] || { icon: Globe, color: "text-white" };
  const occ = post as SocialPostOccurrence;
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full min-w-0 overflow-hidden">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-bold text-white break-words line-clamp-2">{post.content}</p>
            {post.recurring && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full shrink-0">
                🔄 {post.recurringType || "Weekly"} Repeat
                {occ.occurrenceIndex ? ` (#${occ.occurrenceIndex})` : ""}
              </span>
            )}
          </div>
          <p className="text-xs text-white/40">{post.scheduledAt ? timeFormatter.format(postDate(post)) : "Draft"}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 shrink-0">
        {post.media && post.media.length > 0 && <QueueMedia mediaList={post.media} compact />}
        
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPreview}
            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-white/70 hover:bg-white/5 rounded-lg border border-white/10 transition-all cursor-pointer"
          >
            <Eye className="w-3 h-3" /> Preview
          </button>
          {post.status !== "Published" && (
            <button
              type="button"
              onClick={onPublish}
              className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-emerald-500/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3 h-3" /> Publish
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-white/70 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg border border-white/10 hover:border-rose-500/20 transition-all cursor-pointer"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function PostCard({
  post,
  onPreview,
  onDelete,
  onPublish,
}: {
  post: SocialPost;
  onPreview: () => void;
  onDelete: () => void;
  onPublish: () => void;
}) {
  const { icon: Icon, color } = platformIcons[post.platform as keyof typeof platformIcons] || { icon: Globe, color: "text-white" };
  const occ = post as SocialPostOccurrence;
  return (
    <div
      draggable="true"
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", post.id);
      }}
      className="bg-white/5 p-4 rounded-xl shadow-sm border border-white/10 w-full min-w-0 overflow-hidden break-words cursor-grab active:cursor-grabbing hover:border-violet-500/30 transition-colors"
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-7 h-7 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0 ${color}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-white/70 truncate">
            {post.scheduledAt ? timeFormatter.format(postDate(post)) : "Draft"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {post.recurring && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 flex items-center gap-1">
              🔄 {post.recurringType || "Weekly"}
              {occ.occurrenceIndex ? ` #${occ.occurrenceIndex}` : ""}
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${statusClasses(post.status)}`}>
            {post.status}
          </span>
        </div>
      </div>

      <p className="text-xs text-white/90 font-medium mb-3 whitespace-pre-wrap break-words leading-relaxed overflow-hidden">
        {post.content}
      </p>

      {post.media && post.media.length > 0 && <QueueMedia mediaList={post.media} compact={true} />}

      <p className="text-[11px] text-white/40 mb-2 border-l-2 border-white/15 pl-2 font-medium truncate">
        📁 {post.campaign}
      </p>

      {post.hashtags.length > 0 && (
        <p className="text-xs text-violet-400 mb-3 truncate">
          {post.hashtags.map((tag) => `#${tag}`).join(" ")}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-white/5 w-full">
        <button
          type="button"
          onClick={onPreview}
          className="flex-1 min-w-[70px] flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold text-white/70 hover:bg-white/5 rounded-lg border border-white/10 transition-all cursor-pointer"
        >
          <Eye className="w-3 h-3" /> Preview
        </button>
        {post.status !== "Published" && (
          <button
            type="button"
            onClick={onPublish}
            className="flex-1 min-w-[70px] flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-emerald-500/20 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3 h-3" /> Publish
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 min-w-[70px] flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold text-white/70 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg border border-white/10 hover:border-rose-500/20 transition-all cursor-pointer"
        >
          <Trash2 className="w-3 h-3" /> Delete
        </button>
      </div>
    </div>
  );
}

function HighFidelityPlatformCard({ post }: { post: SocialPost }) {
  const media = post.media ?? [];
  const hashtags = post.hashtags ?? [];

  const renderMedia = () => {
    if (media.length === 0) return null;
    if (media.length > 1) {
      return (
        <div className="w-full relative bg-black flex overflow-x-auto scrollbar-thin snap-x snap-mandatory gap-0.5 custom-scrollbar">
          {media.map((item, idx) => (
            <div key={`${item.url}-${idx}`} className="w-full aspect-[4/3] shrink-0 snap-center relative flex items-center justify-center bg-black">
              {item.type === "video" ? (
                <video src={item.url} controls className="w-full h-full object-contain" />
              ) : (
                <img src={item.url} alt={`Media ${idx + 1}`} className="w-full h-full object-contain" />
              )}
              <span className="absolute bottom-2 right-2 bg-black/75 text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white">
                {idx + 1}/{media.length}
              </span>
            </div>
          ))}
        </div>
      );
    }
    const item = media[0];
    return (
      <div className="w-full bg-black aspect-[4/3] flex items-center justify-center relative overflow-hidden">
        {item.type === "video" ? (
          <video src={item.url} controls className="w-full h-full object-contain" />
        ) : (
          <img src={item.url} alt="Media" className="w-full h-full object-contain" />
        )}
      </div>
    );
  };

  if (post.platform === "X") {
    return (
      <div className="p-4 flex gap-3 text-white leading-normal bg-[#0b0717]">
        <div className="w-10 h-10 rounded-full bg-neutral-800 shrink-0 flex items-center justify-center font-bold text-xs border border-white/5">
          SP
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-white">SocialPilot</span>
            <span className="text-xs text-white/45">@socialpilot</span>
            <span className="text-xs text-white/45">·</span>
            <span className="text-xs text-white/45">1m</span>
          </div>
          <p className="text-[13.5px] text-white/95 mt-1.5 whitespace-pre-wrap break-words leading-relaxed">
            {post.content}
          </p>
          {hashtags.length > 0 && (
            <p className="text-[13.5px] text-violet-400 mt-1.5 break-words">
              {hashtags.map((tag) => `#${tag}`).join(" ")}
            </p>
          )}
          {media.length > 0 && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black">
              {renderMedia()}
            </div>
          )}
          <div className="flex justify-between text-white/40 mt-4 text-[11px] max-w-xs font-semibold">
            <span>💬 2</span>
            <span>🔁 8</span>
            <span>❤️ 42</span>
            <span>📊 1.2K</span>
          </div>
        </div>
      </div>
    );
  }

  if (post.platform === "Instagram") {
    return (
      <div className="text-white leading-normal flex flex-col bg-[#0b0717]">
        <div className="p-3.5 flex items-center gap-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[1.5px] shrink-0">
            <div className="w-full h-full rounded-full bg-[#0b0717] flex items-center justify-center text-[10px] font-bold text-white">
              SP
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs text-white">socialpilot</p>
            <p className="text-[9px] text-white/45">Bengaluru, India</p>
          </div>
        </div>
        {media.length > 0 && (
          <div className="w-full bg-black flex flex-col items-center justify-center">
            {renderMedia()}
          </div>
        )}
        <div className="p-3 flex justify-between items-center text-lg border-t border-white/5">
          <div className="flex gap-4">
            <span>❤️</span>
            <span>💬</span>
            <span>✈️</span>
          </div>
          <span>🔖</span>
        </div>
        <div className="px-3.5 pb-4 space-y-1">
          <p className="text-xs">
            <span className="font-bold text-white mr-1.5">socialpilot</span>{" "}
            <span className="text-white/85 whitespace-pre-wrap break-words">{post.content}</span>
          </p>
          {hashtags.length > 0 && (
            <p className="text-xs text-blue-400 break-words">
              {hashtags.map((tag) => `#${tag}`).join(" ")}
            </p>
          )}
          <p className="text-[9px] text-white/40 uppercase tracking-wide">Scheduled</p>
        </div>
      </div>
    );
  }

  if (post.platform === "LinkedIn") {
    return (
      <div className="p-4 text-white leading-normal flex flex-col bg-[#0b0717]">
        <div className="flex gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-neutral-800 shrink-0 flex items-center justify-center font-bold text-xs border border-white/5">
            SP
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="font-bold text-xs text-white">SocialPilot</p>
              <span className="text-[10px] text-white/45">• 1st</span>
            </div>
            <p className="text-[9.5px] text-white/40 truncate">Social Media Management Platform</p>
            <p className="text-[9px] text-white/30 flex items-center gap-1">
              <span>Scheduled •</span>
              <span>🌐</span>
            </p>
          </div>
        </div>
        <p className="text-xs text-white/90 whitespace-pre-wrap break-words leading-relaxed mb-3">
          {post.content}
        </p>
        {hashtags.length > 0 && (
          <p className="text-xs text-indigo-400 break-words mb-3">
            {hashtags.map((tag) => `#${tag}`).join(" ")}
          </p>
        )}
        {media.length > 0 && (
          <div className="rounded-lg overflow-hidden border border-white/10 bg-black mb-3">
            {renderMedia()}
          </div>
        )}
        <div className="flex justify-between items-center text-[10px] text-white/40 border-b border-white/5 pb-2 mb-2 font-medium">
          <span>👍 ❤️ 👏 48</span>
          <span>• 4 comments</span>
        </div>
        <div className="flex justify-between text-white/50 text-xs py-1 font-bold">
          <span>👍 Like</span>
          <span>💬 Comment</span>
          <span>🔁 Repost</span>
          <span>✈️ Send</span>
        </div>
      </div>
    );
  }

  if (post.platform === "Facebook") {
    return (
      <div className="p-4 text-white leading-normal flex flex-col bg-[#0b0717]">
        <div className="flex gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-neutral-800 shrink-0 flex items-center justify-center font-bold text-xs border border-white/5">
            SP
          </div>
          <div>
            <p className="font-bold text-xs text-white">SocialPilot</p>
            <p className="text-[10px] text-white/40 flex items-center gap-1">
              <span>Scheduled •</span>
              <span>🌎</span>
            </p>
          </div>
        </div>
        <p className="text-xs text-white/90 whitespace-pre-wrap break-words leading-relaxed mb-3">
          {post.content}
        </p>
        {hashtags.length > 0 && (
          <p className="text-xs text-blue-400 break-words mb-3">
            {hashtags.map((tag) => `#${tag}`).join(" ")}
          </p>
        )}
        {media.length > 0 && (
          <div className="overflow-hidden border-y border-white/10 bg-black -mx-4 mb-3">
            {renderMedia()}
          </div>
        )}
        <div className="flex justify-between text-[10px] text-white/40 border-b border-white/5 pb-2.5 mb-2 font-medium">
          <span>👍❤️ 84</span>
          <span>12 comments · 3 shares</span>
        </div>
        <div className="flex justify-around text-white/50 text-[11px] font-bold">
          <span>👍 Like</span>
          <span>💬 Comment</span>
          <span>🔁 Share</span>
        </div>
      </div>
    );
  }

  if (post.platform === "Pinterest") {
    return (
      <div className="text-white leading-normal flex flex-col bg-[#0b0717]">
        <div className="p-3 flex justify-between items-center">
          <span className="text-lg">🔗</span>
          <button type="button" className="px-4 py-1.5 bg-[#bd081c] text-white text-xs font-bold rounded-full hover:bg-[#a60718] transition-all">
            Save
          </button>
        </div>
        {media.length > 0 && (
          <div className="px-4 bg-black flex items-center justify-center">
            <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0b0717]">
              {renderMedia()}
            </div>
          </div>
        )}
        <div className="p-4 space-y-2">
          <h4 className="font-extrabold text-sm leading-tight truncate">
            {post.content}
          </h4>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold border border-white/5">
              SP
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-white">socialpilot</p>
              <p className="text-[9px] text-white/40">1.2k followers</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (post.platform === "YouTube") {
    const isVideoType = post.contentType === "Video" || post.contentType === "Reel";
    if (isVideoType) {
      return (
        <div className="text-white leading-normal flex flex-col bg-black/40">
          <div className="relative w-full aspect-video bg-neutral-900 border-b border-white/5 flex items-center justify-center">
            {media.length > 0 ? (
              renderMedia()
            ) : (
              <span className="absolute bottom-2 right-2 bg-black/85 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                2:34
              </span>
            )}
          </div>
          <div className="p-4 space-y-2.5">
            <h4 className="font-bold text-sm leading-snug line-clamp-2">
              {post.content}
            </h4>
            <p className="text-[10px] text-white/40 leading-none">
              0 views · Scheduled · {hashtags.map((tag) => `#${tag}`).join(" ")}
            </p>
            <div className="flex justify-between items-center border-t border-white/5 pt-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold border border-white/5">
                  SP
                </div>
                <div>
                  <p className="font-bold text-[11px] text-white">SocialPilot</p>
                  <p className="text-[9px] text-white/40">12K subscribers</p>
                </div>
              </div>
              <button type="button" className="px-3 py-1.5 bg-white text-black text-[10px] font-black rounded-full hover:bg-neutral-200 transition-all">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      );
    }

    // YouTube Community Post format for Text / Image / Carousel
    return (
      <div className="p-4 text-white leading-normal flex flex-col bg-[#0b0717]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold border border-white/5">
              SP
            </div>
            <div>
              <p className="font-bold text-xs text-white">SocialPilot</p>
              <p className="text-[10px] text-white/40">Scheduled · Community Post</p>
            </div>
          </div>
          <span className="text-white/30 text-xs font-bold">⋮</span>
        </div>
        <p className="text-xs text-white/90 whitespace-pre-wrap break-words leading-relaxed mb-3">
          {post.content}
        </p>
        {hashtags.length > 0 && (
          <p className="text-xs text-blue-400 break-words mb-3">
            {hashtags.map((tag) => `#${tag}`).join(" ")}
          </p>
        )}
        {media.length > 0 && (
          <div className="rounded-xl overflow-hidden border border-white/10 bg-black mb-3">
            {renderMedia()}
          </div>
        )}
        <div className="flex items-center gap-6 text-white/50 text-xs pt-2.5 border-t border-white/5 font-semibold">
          <span className="flex items-center gap-1.5 cursor-pointer hover:text-white">👍 0</span>
          <span className="cursor-pointer hover:text-white">👎</span>
          <span className="flex items-center gap-1.5 cursor-pointer hover:text-white">💬 0</span>
          <span className="ml-auto cursor-pointer hover:text-white">↗️ Share</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 text-white">
      <p className="text-sm">{post.content}</p>
    </div>
  );
}

function PreviewModal({ post, onClose }: { post: SocialPost; onClose: () => void }) {
  const { icon: Icon, color } = platformIcons[post.platform as keyof typeof platformIcons] || { icon: Globe, color: "text-white" };
  const occ = post as SocialPostOccurrence;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0d0920] rounded-2xl shadow-2xl border border-white/10 animate-scale-in overflow-hidden flex flex-col max-h-[90vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 ${color}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold text-white">{post.platform} Live Preview</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Schedule & Occurrence info bar */}
        <div className="px-4 py-2 bg-violet-950/20 border-b border-white/5 flex items-center justify-between text-xs shrink-0">
          <span className="text-white/60 font-medium">
            🗓️ {post.scheduledAt ? `${dateFormatter.format(postDate(post))} at ${timeFormatter.format(postDate(post))}` : "Draft"}
          </span>
          {post.recurring && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
              🔄 {post.recurringType || "Weekly"}
              {occ.occurrenceIndex ? ` #${occ.occurrenceIndex}` : ""}
            </span>
          )}
        </div>

        {/* High-Fidelity Mock Card Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#05030e]">
          <div className="rounded-xl border border-white/10 overflow-hidden shadow-xl bg-[#0b0717]">
            <HighFidelityPlatformCard post={post} />
          </div>
        </div>
      </div>
    </div>
  );
}

function QueueMedia({ mediaList, compact = false }: { mediaList?: NonNullable<SocialPost["media"]>; compact?: boolean }) {
  if (!mediaList || mediaList.length === 0) return null;

  if (mediaList.length > 1) {
    return (
      <div className={`relative bg-black border border-white/10 rounded-lg overflow-hidden flex gap-0.5 overflow-x-auto snap-x snap-mandatory ${compact ? 'h-16 w-full' : 'w-full max-h-56'}`}>
        {mediaList.map((media, idx) => (
          <div key={`${media.url}-${idx}`} className={`shrink-0 snap-center relative flex items-center justify-center bg-black ${compact ? 'w-20 h-16' : 'w-full h-48'}`}>
            {media.type === "video" ? (
              <video src={media.url} className="w-full h-full object-cover" />
            ) : (
              <img src={media.url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover" />
            )}
            {!compact && (
              <span className="absolute bottom-2 right-2 bg-black/75 text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white">
                {idx + 1}/{mediaList.length}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  const media = mediaList[0];
  if (media.type === "video") {
    return <video controls={!compact} src={media.url} className={compact ? "w-12 h-12 rounded-lg object-cover bg-black shrink-0 border border-white/10" : "w-full max-h-52 object-cover rounded-lg mb-3 bg-black border border-white/10"} />;
  }
  return <img src={media.url} alt={media.name} className={compact ? "w-12 h-12 rounded-lg object-cover shrink-0 border border-white/10" : "w-full max-h-52 object-cover rounded-lg mb-3 border border-white/10"} />;
}

function EmptyState({ mode }: { mode: CalendarMode }) {
  return (
    <div className="border border-dashed border-white/10 rounded-xl p-8 text-center bg-white/5">
      <Clock className="w-6 h-6 text-white/20 mx-auto mb-2" />
      <p className="text-sm font-bold text-white">No posts listed</p>
      <p className="text-xs text-white/40 mt-1">
        {mode === "Queue" ? "Create or schedule a post to fill the queue." : "Pick another date or add a post."}
      </p>
    </div>
  );
}
