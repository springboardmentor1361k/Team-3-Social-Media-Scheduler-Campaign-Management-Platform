"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Globe,
  RefreshCw,
  Search,
  Server,
  Trash2,
  X,
  XCircle,
  FileCode,
  ShieldAlert,
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
  PostStatus,
  SocialPost,
} from "@/lib/postStore";

const platformIcons = {
  X: { icon: FaTwitter, color: "text-white", bg: "bg-white/10" },
  Instagram: { icon: FaInstagram, color: "text-[#e4405f]", bg: "bg-[#e4405f]/10" },
  LinkedIn: { icon: FaLinkedin, color: "text-[#0077b5]", bg: "bg-[#0077b5]/10" },
  Facebook: { icon: FaFacebook, color: "text-[#1877f2]", bg: "bg-[#1877f2]/10" },
  YouTube: { icon: FaYoutube, color: "text-[#ff0000]", bg: "bg-[#ff0000]/10" },
  Pinterest: { icon: FaPinterest, color: "text-[#bd081c]", bg: "bg-[#bd081c]/10" },
};

const statusConfig: Record<
  PostStatus,
  { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }
> = {
  Published: {
    label: "Published",
    badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    icon: CheckCircle2,
  },
  Scheduled: {
    label: "Scheduled",
    badge: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    icon: Clock,
  },
  Failed: {
    label: "Failed",
    badge: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    icon: AlertTriangle,
  },
  Cancelled: {
    label: "Cancelled",
    badge: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    icon: XCircle,
  },
  Draft: {
    label: "Draft",
    badge: "text-white/50 bg-white/5 border-white/10",
    icon: FileCode,
  },
};

function formatLogDate(dateStr: string | null) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

import { apiListLogs, apiUpdatePost, apiQueuePublish, apiDeletePost } from "@/lib/api";

export default function PublishingLogsView() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  
  const fetchLogs = async () => {
    try {
      const data = await apiListLogs();
      setLogs(data);
    } catch (e) {
      console.error("Failed to fetch logs", e);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchLogs();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"All" | Platform>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | PostStatus>("All");
  const [selectedDiagnosticPost, setSelectedDiagnosticPost] = useState<any | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const retrySinglePost = async (id: string) => {
    setRetryingId(id);
    try {
      await apiQueuePublish(Number(id));
      await fetchLogs();
    } finally {
      setRetryingId(null);
    }
  };

  const cancelScheduledPost = async (id: string) => {
    await apiUpdatePost(Number(id), { status: "Cancelled" });
    await fetchLogs();
  };

  const deletePost = async (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id.toString() !== id.toString()));
    try {
      await apiDeletePost(Number(id));
    } catch (e) {
      console.error("Failed to delete log post:", e);
    } finally {
      await fetchLogs();
    }
  };

  const retryAllFailedPosts = async () => {
    const failed = logs.filter(p => p.status === "failed");
    for (const p of failed) {
      if (p.post_id) {
        await apiQueuePublish(Number(p.post_id));
      }
    }
    await fetchLogs();
  };

  // Compute log counts for stat KPI cards
  const stats = useMemo(() => {
    return {
      total: logs.length,
      published: logs.filter((p) => p.status.toLowerCase() === "published").length,
      scheduled: logs.filter((p) => p.status.toLowerCase() === "pending" || p.status.toLowerCase() === "scheduled").length,
      failed: logs.filter((p) => p.status.toLowerCase() === "failed").length,
      cancelled: logs.filter((p) => p.status.toLowerCase() === "cancelled").length,
    };
  }, [logs]);

  // Filtered log list
  const filteredLogs = useMemo(() => {
    return logs
      .map(post => {
        let platformName = post.platform || "X";
        if (platformName.toLowerCase() === "twitter" || platformName.toLowerCase() === "x") {
          platformName = "X";
        } else if (platformName) {
          platformName = platformName.charAt(0).toUpperCase() + platformName.slice(1);
        }

        const rawStatus = (post.status || "draft").toLowerCase();
        let formattedStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
        if (formattedStatus === "Queued") formattedStatus = "Scheduled";

        return {
          ...post,
          id: post.id.toString(),
          platform: platformName,
          status: formattedStatus,
          errorMessage: post.error_message,
          retryCount: post.retry_count,
          scheduledAt: post.scheduled_time,
          createdAt: post.created_at,
          platformResponse: post.platform_response,
          campaign: "General",
        };
      })
      .filter((post) => {
        if (platformFilter !== "All" && post.platform !== platformFilter) return false;
        if (statusFilter !== "All" && post.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchContent = post.content?.toLowerCase().includes(q) || false;
          const matchError = post.errorMessage?.toLowerCase().includes(q) || false;
          if (!matchContent && !matchError) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeB - timeA;
      });
  }, [logs, platformFilter, statusFilter, searchQuery]);
  if (!mounted) return null;

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar flex flex-col min-w-0 bg-transparent">
      {/* Top Action Controls */}
      <div className="flex items-center justify-end gap-3 mb-8 flex-wrap">
        {stats.failed > 0 && (
          <button
            type="button"
            onClick={retryAllFailedPosts}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-900/30 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" /> Retry All Failed ({stats.failed})
          </button>
        )}
        <Link
          href="/create"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-900/30"
        >
          + Create New Post
        </Link>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <div className="p-4.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
          <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Total Logs</span>
          <p className="text-2xl font-black text-white mt-2">{stats.total}</p>
        </div>

        <div className="p-4.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{stats.published}</p>
        </div>

        <div className="p-4.5 rounded-xl bg-violet-500/5 border border-violet-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Scheduled</span>
            <Clock className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-2xl font-black text-violet-400 mt-2">{stats.scheduled}</p>
        </div>

        <div className="p-4.5 rounded-xl bg-rose-500/5 border border-rose-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Failed</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 mt-2">{stats.failed}</p>
        </div>

        <div className="p-4.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Cancelled</span>
            <XCircle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs by caption, campaign, handle, or error..."
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder:text-white/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as "All" | Platform)}
            className="px-3.5 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-white cursor-pointer"
          >
            <option value="All" className="bg-[#05030e] text-white">All Platforms</option>
            {Object.keys(platformIcons).map((p) => (
              <option key={p} value={p} className="bg-[#05030e] text-white">{p}</option>
            ))}
          </select>

          <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
            {(["All", "Published", "Scheduled", "Failed", "Cancelled"] as const).map((st) => (
              <button
                type="button"
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === st
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Feed Table / Cards */}
      <div className="space-y-4 min-w-0">
        {filteredLogs.map((log) => {
          const plat = platformIcons[log.platform as keyof typeof platformIcons] || {
            icon: Globe,
            color: "text-white",
            bg: "bg-white/10",
          };
          const PlatformIcon = plat.icon;
          const statusMeta = statusConfig[log.status] || statusConfig.Draft;
          const StatusIcon = statusMeta.icon;
          const isRetrying = retryingId === log.id;
          const occ = log as SocialPostOccurrence;

          return (
            <div
              key={log.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:border-violet-500/30 transition-all shadow-md group"
            >
              {/* Left Column: Platform & Content */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-xl ${plat.bg} flex items-center justify-center border border-white/10 shrink-0 ${plat.color} mt-0.5`}>
                  <PlatformIcon className="w-5 h-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-xs text-white/90">@socialpilot</span>
                    <span className="text-[10px] text-white/30">•</span>
                    <span className="text-xs text-white/40 font-medium">
                      {formatLogDate(log.scheduledAt || log.createdAt)}
                    </span>
                    <span className="text-[10px] text-white/30">•</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">
                      📁 {log.campaign}
                    </span>
                    {log.recurring && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                        🔄 {log.recurringType || "Weekly"}
                        {occ.occurrenceIndex ? ` #${occ.occurrenceIndex}` : ""}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-medium text-white break-words line-clamp-2 leading-relaxed">
                    {log.content}
                  </p>

                  {/* Diagnostic Error Banner if Failed */}
                  {log.status === "Failed" && (
                    <div className="mt-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-2 text-rose-300 text-xs">
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                        <span className="truncate font-mono text-[11px]">
                          {log.errorMessage || "OAuth Token Expired or Rate Limit (429)"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedDiagnosticPost(log)}
                        className="text-[10px] font-black underline text-rose-400 hover:text-rose-300 shrink-0 cursor-pointer"
                      >
                        Inspect Trace
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Status & Controls */}
              <div className="flex items-center gap-3 shrink-0 self-end lg:self-center flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${statusMeta.badge}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusMeta.label}
                  {log.retryCount ? ` (${log.retryCount}x)` : ""}
                </span>

                <div className="flex items-center gap-1.5">
                  {log.status === "Failed" && (
                    <button
                      type="button"
                      onClick={() => retrySinglePost(log.id)}
                      disabled={isRetrying}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                      {isRetrying ? "Retrying..." : "Retry Now"}
                    </button>
                  )}

                  {log.status === "Scheduled" && (
                    <button
                      type="button"
                      onClick={() => cancelScheduledPost(log.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/10 rounded-lg border border-amber-500/20 transition-all cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedDiagnosticPost(log)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white/70 hover:bg-white/10 rounded-lg border border-white/10 transition-all cursor-pointer"
                  >
                    <Server className="w-3.5 h-3.5" /> Details
                  </button>

                  <button
                    type="button"
                    onClick={() => deletePost(log.id)}
                    className="p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                    title="Delete log entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center bg-white/5">
            <Activity className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No publishing logs found</h3>
            <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
              No log execution history matches your selected platform or status filters. Try clearing your filters or creating a new post.
            </p>
          </div>
        )}
      </div>

      {/* Diagnostic Log Detail Drawer Modal */}
      {selectedDiagnosticPost && (
        <DiagnosticModal
          post={selectedDiagnosticPost}
          onClose={() => setSelectedDiagnosticPost(null)}
          onRetry={() => {
            retrySinglePost(selectedDiagnosticPost.id);
            setSelectedDiagnosticPost(null);
          }}
        />
      )}
    </div>
  );
}

function DiagnosticModal({
  post,
  onClose,
  onRetry,
}: {
  post: SocialPost;
  onClose: () => void;
  onRetry: () => void;
}) {
  const plat = platformIcons[post.platform as keyof typeof platformIcons] || {
    icon: Globe,
    color: "text-white",
  };
  const PlatformIcon = plat.icon;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0d0920] rounded-2xl shadow-2xl border border-white/10 animate-scale-in overflow-hidden flex flex-col max-h-[90vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 ${plat.color}`}>
              <PlatformIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{post.platform} API Diagnostic Log</h3>
              <p className="text-[10px] text-white/40">Log ID: {post.id.slice(0, 18)}...</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Diagnostic Details */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4 text-xs">
          {/* Status Box */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-white/60 font-semibold">Execution Status</span>
            <span
              className={`font-bold px-2.5 py-1 rounded text-xs border ${
                statusConfig[post.status]?.badge || statusConfig.Draft.badge
              }`}
            >
              {post.status}
            </span>
          </div>

          {/* Error Trace if Failed */}
          {post.status === "Failed" && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>API Response Error (HTTP 429 / 401)</span>
              </div>
              <p className="font-mono text-[11px] text-rose-200/90 bg-black/40 p-3 rounded-lg border border-rose-500/20 leading-relaxed whitespace-pre-wrap break-all">
                {post.errorMessage || "OAuth Token Expired or API Rate Limit Exceeded during auto-publishing."}
              </p>
            </div>
          )}

          {/* Technical Metadata Table */}
          <div className="rounded-xl border border-white/10 overflow-hidden bg-black/30">
            <div className="p-3 border-b border-white/5 flex justify-between">
              <span className="text-white/40 font-semibold">Target Network</span>
              <span className="text-white font-bold">{post.platform} API v2</span>
            </div>
            <div className="p-3 border-b border-white/5 flex justify-between">
              <span className="text-white/40 font-semibold">Channel Handle</span>
              <span className="text-violet-300 font-bold">@socialpilot</span>
            </div>
            <div className="p-3 border-b border-white/5 flex justify-between">
              <span className="text-white/40 font-semibold">Content Type</span>
              <span className="text-white font-bold">{post.contentType}</span>
            </div>
            <div className="p-3 border-b border-white/5 flex justify-between">
              <span className="text-white/40 font-semibold">Scheduled Date</span>
              <span className="text-white font-bold">{formatLogDate(post.scheduledAt)}</span>
            </div>
            <div className="p-3 flex justify-between">
              <span className="text-white/40 font-semibold">Retry Count</span>
              <span className="text-white font-bold">{post.retryCount || 0} attempt(s)</span>
            </div>
          </div>

          {/* Payload Content Preview */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-white/40">Post Payload Content</span>
            <p className="text-white/80 whitespace-pre-wrap break-words leading-relaxed">
              {post.content}
            </p>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-3 shrink-0 bg-white/[0.02]">
          <Link
            href="/accounts"
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 rounded-xl font-bold transition-all text-xs"
          >
            Reconnect Account
          </Link>
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Publishing
          </button>
        </div>
      </div>
    </div>
  );
}
