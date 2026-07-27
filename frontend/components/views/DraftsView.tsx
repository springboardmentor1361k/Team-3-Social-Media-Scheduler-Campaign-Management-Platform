"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Plus,
  Search,
  Calendar as CalendarIcon,
  Send,
  Edit3,
  Trash2,
  X,
  Clock,
  Globe,
  Tag,
  CheckCircle2,
  FileText,
  CheckSquare,
  Square,
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
  ContentType,
  SocialPost,
} from "@/lib/postStore";
import { apiListPosts, apiCreatePost, apiUpdatePost, apiDeletePost, apiQueuePublish } from "@/lib/api";

const platformIcons: Record<string, { icon: any; color: string; label: string; limit: number }> = {
  X: { icon: FaTwitter, color: "text-white bg-black border-white/20", label: "X (Twitter)", limit: 280 },
  Instagram: { icon: FaInstagram, color: "text-[#e4405f] bg-[#e4405f]/10 border-[#e4405f]/30", label: "Instagram", limit: 2200 },
  LinkedIn: { icon: FaLinkedin, color: "text-[#0077b5] bg-[#0077b5]/10 border-[#0077b5]/30", label: "LinkedIn", limit: 3000 },
  Facebook: { icon: FaFacebook, color: "text-[#1877f2] bg-[#1877f2]/10 border-[#1877f2]/30", label: "Facebook", limit: 63206 },
  YouTube: { icon: FaYoutube, color: "text-[#ff0000] bg-[#ff0000]/10 border-[#ff0000]/30", label: "YouTube", limit: 5000 },
  Pinterest: { icon: FaPinterest, color: "text-[#bd081c] bg-[#bd081c]/10 border-[#bd081c]/30", label: "Pinterest", limit: 500 },
};

const contentTypes: ContentType[] = ["Text", "Image", "Video", "Carousel", "Story", "Reel"];
const draftCategories = ["General", "Product Announcement", "Blog Snippet", "Promotional", "Tech Tip"];

export default function DraftsView() {
  const [drafts, setDrafts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrafts = async () => {
    try {
      const data = await apiListPosts("draft");
      const mapped: SocialPost[] = data.map(p => {
        let platformName = p.platform || "X";
        if (platformName.toLowerCase() === "twitter" || platformName.toLowerCase() === "x") {
          platformName = "X";
        } else if (platformName) {
          platformName = platformName.charAt(0).toUpperCase() + platformName.slice(1);
        }

        return {
          id: p.id.toString(),
          content: p.content,
          contentType: (p.draft_metadata?.contentType || "Text") as any,
          platform: platformName as Platform,
          status: "Draft",
          scheduledAt: p.scheduled_time || null,
          createdAt: p.created_at,
          media: p.media_urls?.map(url => ({ url, type: 'image' as const, name: "media", size: 0 })) || [],
          campaign: p.draft_metadata?.campaign || "General",
          hashtags: p.draft_metadata?.hashtags || [],
          category: p.draft_metadata?.category || "General",
          recurring: p.draft_metadata?.recurring || false,
        };
      });
      setDrafts(mapped);
    } catch (e: any) {
      console.warn("Could not fetch drafts from server:", e?.message || e);
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchDrafts().then(() => { if (!isMounted) return; });
    return () => { isMounted = false; };
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"All" | Platform>("All");
  const [typeFilter, setTypeFilter] = useState<"All" | ContentType>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [scheduleModalPost, setScheduleModalPost] = useState<SocialPost | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const [editModalPost, setEditModalPost] = useState<SocialPost | null>(null);
  const [createDraftModalOpen, setCreateDraftModalOpen] = useState(false);
  const [bulkScheduleModalOpen, setBulkScheduleModalOpen] = useState(false);

  // Form states for Create/Edit Draft
  const [draftContent, setDraftContent] = useState("");
  const [draftPlatform, setDraftPlatform] = useState<Platform>("X");
  const [draftType, setDraftType] = useState<ContentType>("Text");
  const [draftCampaign, setDraftCampaign] = useState("General");
  const [draftCategory, setDraftCategory] = useState("General");
  const [draftApproval, setDraftApproval] = useState<"Draft" | "Needs Review" | "Approved">("Draft");
  const [draftHashtags, setDraftHashtags] = useState("social, marketing");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredDrafts = useMemo(() => {
    return drafts.filter((p) => {
      if (platformFilter !== "All" && p.platform !== platformFilter) return false;
      if (typeFilter !== "All" && p.contentType !== typeFilter) return false;
      if (categoryFilter !== "All" && (p.category || "General") !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.content.toLowerCase().includes(q) ||
          (p.campaign || "").toLowerCase().includes(q) ||
          (p.hashtags || []).some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [drafts, platformFilter, typeFilter, categoryFilter, searchQuery]);

  const toggleSelectAll = () => {
    if (selectedIds.length === drafts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(drafts.map((d) => d.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const idsToDelete = [...selectedIds];
    setSelectedIds([]);
    setDrafts((prev) => prev.filter((d) => !idsToDelete.includes(d.id)));
    showToast(`Deleted ${idsToDelete.length} draft(s)`);
    try {
      for (const id of idsToDelete) {
        await apiDeletePost(Number(id));
      }
    } catch (e) {
      console.error("Bulk delete failed:", e);
    } finally {
      fetchDrafts();
    }
  };

  const deletePost = async (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    showToast("Draft deleted");
    try {
      await apiDeletePost(Number(id));
    } catch (e) {
      console.error("Delete draft failed:", e);
    } finally {
      fetchDrafts();
    }
  };

  const handleConfirmBulkSchedule = async () => {
    if (selectedIds.length === 0 || !scheduleDate) return;
    const combined = new Date(`${scheduleDate}T${scheduleTime}:00`);
    const count = selectedIds.length;
    for (const id of selectedIds) {
      await apiUpdatePost(Number(id), { status: "Scheduled", scheduled_time: combined.toISOString() });
      await apiQueuePublish(Number(id));
    }
    setSelectedIds([]);
    setBulkScheduleModalOpen(false);
    fetchDrafts();
    showToast(`Scheduled ${count} draft(s) successfully!`);
  };

  const handleOpenSchedule = (post: SocialPost) => {
    setScheduleModalPost(post);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split("T")[0]);
  };

  const handleConfirmSchedule = async () => {
    if (!scheduleModalPost || !scheduleDate) return;
    const combinedDate = new Date(`${scheduleDate}T${scheduleTime}:00`);
    await apiUpdatePost(Number(scheduleModalPost.id), { status: "Scheduled", scheduled_time: combinedDate.toISOString() });
    await apiQueuePublish(Number(scheduleModalPost.id));
    setScheduleModalPost(null);
    fetchDrafts();
    showToast("Draft scheduled successfully!");
  };

  const handlePublishNow = async (id: string) => {
    await apiUpdatePost(Number(id), { status: "Published", scheduled_time: new Date().toISOString() });
    await apiQueuePublish(Number(id));
    fetchDrafts();
    showToast("Post published live!");
  };

  const handleOpenEdit = (post: SocialPost) => {
    setEditModalPost(post);
    setDraftContent(post.content);
    setDraftPlatform(post.platform);
    setDraftType(post.contentType);
    setDraftCampaign(post.campaign || "General");
    setDraftCategory(post.category || "General");
    setDraftApproval(post.approvalStatus || "Draft");
    setDraftHashtags((post.hashtags || []).join(", "));
  };

  const handleSaveEdit = async () => {
    if (!editModalPost) return;
    await apiUpdatePost(Number(editModalPost.id), {
        content: draftContent,
        draft_metadata: {
           contentType: draftType,
           campaign: draftCampaign,
           category: draftCategory,
           approvalStatus: draftApproval,
           hashtags: draftHashtags.split(",").map((s) => s.trim()).filter(Boolean),
        }
    });
    setEditModalPost(null);
    fetchDrafts();
    showToast("Draft saved!");
  };

  const handleCreateDraft = async () => {
    if (!draftContent.trim()) return;
    await apiCreatePost({
      content: draftContent,
      platform: draftPlatform,
      status: "Draft",
      draft_metadata: {
          contentType: draftType,
          campaign: draftCampaign || "General",
          category: draftCategory,
          approvalStatus: draftApproval,
          hashtags: draftHashtags.split(",").map((s) => s.trim()).filter(Boolean),
      }
    });
    setCreateDraftModalOpen(false);
    setDraftContent("");
    fetchDrafts();
    showToast("New draft created!");
  };

  const currentLimit = platformIcons[draftPlatform]?.limit || 280;
  const charsUsed = draftContent.length;
  const isOverLimit = charsUsed > currentLimit;

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto custom-scrollbar relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-violet-900 border border-violet-500 text-white font-bold text-sm shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Action Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-violet-900/40 via-indigo-900/30 to-purple-900/40 border border-violet-500/20 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-2">
          <span className="p-2.5 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400">
            <FolderOpen size={20} />
          </span>
          <span className="text-xs font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1">
            {drafts.length} Unsaved Ideas & Drafts
          </span>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={() => {
              setDraftContent("");
              setCreateDraftModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-900/40 transition-all cursor-pointer"
          >
            <Plus size={16} /> Create New Draft
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when items are selected) */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-violet-900/40 border border-violet-500/30 text-white animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-bold">
            <CheckSquare size={18} className="text-violet-400" />
            <span>{selectedIds.length} draft(s) selected</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setScheduleDate(tomorrow.toISOString().split("T")[0]);
                setBulkScheduleModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <CalendarIcon size={14} /> Batch Schedule
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 size={14} /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <div className="flex flex-1 items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2">
          <Search size={16} className="text-white/40" />
          <input
            type="text"
            placeholder="Search drafts by content, campaign, or hashtag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-white placeholder-white/40 focus:outline-none w-full"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-white/40 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Select All toggle */}
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/70 hover:text-white transition-all cursor-pointer"
          >
            {selectedIds.length === drafts.length && drafts.length > 0 ? <CheckSquare size={14} className="text-violet-400" /> : <Square size={14} />}
            <span>Select All</span>
          </button>

          {/* Platform filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
          >
            <option value="All" className="bg-[#0b081c]">All Platforms</option>
            {Object.keys(platformIcons).map((p) => (
              <option key={p} value={p} className="bg-[#0b081c]">{p}</option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
          >
            <option value="All" className="bg-[#0b081c]">All Categories</option>
            {draftCategories.map((c) => (
              <option key={c} value={c} className="bg-[#0b081c]">{c}</option>
            ))}
          </select>

          {/* Counter Badge */}
          <div className="px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-300">
            {drafts.length} {drafts.length === 1 ? "Draft" : "Drafts"}
          </div>
        </div>
      </div>

      {/* Grid View */}
      {drafts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drafts.map((draft) => {
            const platformConfig = platformIcons[draft.platform] || {
              icon: Globe,
              color: "text-white bg-white/10 border-white/20",
              label: draft.platform,
            };
            const Icon = platformConfig.icon;
            const isSelected = selectedIds.includes(draft.id);

            return (
              <div
                key={draft.id}
                className={`group p-5 rounded-2xl transition-all shadow-xl flex flex-col justify-between relative overflow-hidden border ${
                  isSelected
                    ? "bg-violet-900/20 border-violet-500 ring-2 ring-violet-500/50"
                    : "bg-white/5 hover:bg-white/[0.08] border-white/10 hover:border-violet-500/40"
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSelect(draft.id)}
                        className="text-white/40 hover:text-white"
                      >
                        {isSelected ? <CheckSquare size={16} className="text-violet-400" /> : <Square size={16} />}
                      </button>
                      <span className={`p-2 rounded-xl border ${platformConfig.color}`}>
                        <Icon size={16} />
                      </span>
                      <div>
                        <p className="text-xs font-black text-white">{draft.platform}</p>
                        <p className="text-[10px] text-white/40">{draft.contentType}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {draft.approvalStatus && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          {draft.approvalStatus}
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">
                        {draft.category || "Draft"}
                      </span>
                    </div>
                  </div>

                  {/* Draft Content Snippet */}
                  <p className="text-sm text-white/90 line-clamp-4 leading-relaxed whitespace-pre-wrap font-medium">
                    {draft.content}
                  </p>

                  {/* Media Preview if present */}
                  {draft.media && draft.media.length > 0 && (
                    <div className="rounded-xl overflow-hidden border border-white/10 h-32 bg-black/40 relative">
                      {draft.media[0].type === "video" ? (
                        <video src={draft.media[0].url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={draft.media[0].url} alt="Media" className="w-full h-full object-cover" />
                      )}
                      <span className="absolute bottom-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded bg-black/80 text-white">
                        {draft.media.length} {draft.media.length === 1 ? "file" : "files"}
                      </span>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/40">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
                      📁 {draft.campaign}
                    </span>
                    {draft.hashtags.length > 0 && (
                      <span className="text-violet-400">
                        #{draft.hashtags[0]} {draft.hashtags.length > 1 ? `+${draft.hashtags.length - 1}` : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenSchedule(draft)}
                      className="p-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 transition-all cursor-pointer"
                      title="Schedule Draft"
                    >
                      <CalendarIcon size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePublishNow(draft.id)}
                      className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 transition-all cursor-pointer"
                      title="Publish Now"
                    >
                      <Send size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(draft)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
                      title="Edit Draft"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePost(draft.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all cursor-pointer"
                      title="Delete Draft"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl bg-white/5 border border-dashed border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto">
            <FileText size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No drafts found</h3>
            <p className="text-sm text-white/40 max-w-md mx-auto">
              Save your post ideas as drafts to edit later, or create your first draft right now.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraftContent("");
              setCreateDraftModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-900/40 transition-all cursor-pointer"
          >
            Create Your First Draft
          </button>
        </div>
      )}

      {/* Schedule Draft Modal */}
      {scheduleModalPost && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0d0920] rounded-2xl border border-white/10 p-6 space-y-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-violet-400">
                <CalendarIcon size={18} />
                <h3 className="text-lg font-black text-white">Schedule Draft</h3>
              </div>
              <button onClick={() => setScheduleModalPost(null)} className="text-white/40 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-white/60 bg-white/5 p-3 rounded-xl border border-white/10 line-clamp-2">
              "{scheduleModalPost.content}"
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">Select Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">Select Time</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setScheduleModalPost(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-semibold text-sm border border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSchedule}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-900/40"
              >
                Schedule Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Schedule Modal */}
      {bulkScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0d0920] rounded-2xl border border-white/10 p-6 space-y-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-violet-400">
                <CalendarIcon size={18} />
                <h3 className="text-lg font-black text-white">Batch Schedule ({selectedIds.length} Drafts)</h3>
              </div>
              <button onClick={() => setBulkScheduleModalOpen(false)} className="text-white/40 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">Select Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">Select Time</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBulkScheduleModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-semibold text-sm border border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkSchedule}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-900/40"
              >
                Batch Schedule All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Draft Modal */}
      {(createDraftModalOpen || editModalPost) && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0d0920] rounded-2xl border border-white/10 p-6 space-y-5 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-violet-400">
                <Edit3 size={18} />
                <h3 className="text-lg font-black text-white">
                  {editModalPost ? "Edit Draft" : "Create New Draft"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setCreateDraftModalOpen(false);
                  setEditModalPost(null);
                }}
                className="text-white/40 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">Draft Content</label>
                <textarea
                  rows={4}
                  placeholder="Write your draft copy..."
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-white/5 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-white/30 resize-none ${
                    isOverLimit ? "border-rose-500 focus:ring-rose-500" : "border-white/10"
                  }`}
                />
                <div className="flex items-center justify-between text-[11px] mt-1 font-semibold">
                  <span className={isOverLimit ? "text-rose-400" : "text-white/40"}>
                    {charsUsed} / {currentLimit} chars ({draftPlatform})
                  </span>
                  {isOverLimit && <span className="text-rose-400 font-bold">Exceeds limit!</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5">Target Platform</label>
                  <select
                    value={draftPlatform}
                    onChange={(e) => setDraftPlatform(e.target.value as Platform)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d0920] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    {Object.keys(platformIcons).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5">Category</label>
                  <select
                    value={draftCategory}
                    onChange={(e) => setDraftCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d0920] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    {draftCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5">Campaign</label>
                  <input
                    type="text"
                    placeholder="Campaign Name"
                    value={draftCampaign}
                    onChange={(e) => setDraftCampaign(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5">Approval Status</label>
                  <select
                    value={draftApproval}
                    onChange={(e) => setDraftApproval(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d0920] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Needs Review">Needs Review</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">Hashtags (comma separated)</label>
                <input
                  type="text"
                  placeholder="growth, saas"
                  value={draftHashtags}
                  onChange={(e) => setDraftHashtags(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setCreateDraftModalOpen(false);
                  setEditModalPost(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-semibold text-sm border border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isOverLimit}
                onClick={editModalPost ? handleSaveEdit : handleCreateDraft}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-violet-900/40"
              >
                {editModalPost ? "Save Draft" : "Save as Draft"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
