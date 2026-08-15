"use client";

import { useMemo, useState } from "react";
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
  formatDateKey,
  usePosts,
  retryAllFailedPosts,
  updatePost,
} from "@/lib/postStore";

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
  const { posts, deletePost, updatePostStatus } = usePosts();
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(startOfDay(new Date()));
  const [platformFilter, setPlatformFilter] = useState<"All" | Platform>("All");
  const [mode, setMode] = useState<CalendarMode>("Month");
  const [previewPost, setPreviewPost] = useState<SocialPost | null>(null);
  const [draggedOverDate, setDraggedOverDate] = useState<string | null>(null);

  const filteredPosts = useMemo(
    () =>
      platformFilter === "All"
        ? posts
        : posts.filter((post) => post.platform === platformFilter),
    [platformFilter, posts],
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
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar flex flex-col min-w-0">
        {/* Failed Post Alert Banner if any failed posts exist */}
        {counts.failed > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-rose-300">
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
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
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
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-white cursor-pointer"
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
        <div className="flex items-center justify-between mb-6">
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

                      updatePost({
                        ...post,
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

                      <div className="flex items-center gap-1 mt-auto pb-1">
                        {day.scheduledCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 border border-violet-500/30 font-bold">
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
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full min-w-0 overflow-hidden">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white break-words line-clamp-2">{post.content}</p>
          <p className="text-xs text-white/40 mt-0.5">{post.scheduledAt ? timeFormatter.format(postDate(post)) : "Draft"}</p>
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
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${statusClasses(post.status)}`}>
          {post.status}
        </span>
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

function PreviewModal({ post, onClose }: { post: SocialPost; onClose: () => void }) {
  const { icon: Icon, color } = platformIcons[post.platform as keyof typeof platformIcons] || { icon: Globe, color: "text-white" };
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0d0920] rounded-xl shadow-xl border border-white/10 animate-scale-in overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className={`flex items-center gap-2 ${color}`}>
            <Icon className="w-4 h-4" />
            <span className="text-sm font-bold">{post.platform} Preview</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/40 hover:text-white" />
          </button>
        </div>
        <div className="p-5">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-600 shrink-0 flex items-center justify-center text-white text-xs font-bold">
              SP
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">SocialPilot Team</span>
                <span className="text-xs text-white/40 font-semibold">
                  {post.scheduledAt ? timeFormatter.format(postDate(post)) : "draft"}
                </span>
              </div>
              <p className="text-sm text-white/80 mt-2 whitespace-pre-wrap break-words">{post.content}</p>
              {post.hashtags.length > 0 && (
                <p className="text-sm text-violet-400 mt-2">{post.hashtags.map((tag) => `#${tag}`).join(" ")}</p>
              )}
              {post.media && post.media.length > 0 && <QueueMedia mediaList={post.media} />}
            </div>
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
