"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Sparkles,
} from "lucide-react";
import AIAssistantModal from "@/components/ui/AIAssistantModal";
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
  usePosts,
} from "@/lib/postStore";
import { apiListPosts, apiCreatePost, apiUpdatePost, apiDeletePost, apiQueuePublish, apiListCampaigns } from "@/lib/api";

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
  const router = useRouter();
  const { posts: storePosts, addPosts: addStorePosts, deletePost: deleteStorePost, updatePost: updateStorePost, updatePostStatus } = usePosts();
  const [drafts, setDrafts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignsList, setCampaignsList] = useState<string[]>([
    "General",
    "Summer Product Surge",
    "Brand Awareness 2026",
    "Product Launch Q3",
    "Holiday Promo 2026",
  ]);

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

      const storeDrafts = storePosts.filter((p) => p.status === "Draft");
      const map = new Map<string, SocialPost>();
      storeDrafts.forEach(d => map.set(d.id, d));
      mapped.forEach(d => map.set(d.id, d));

      setDrafts(Array.from(map.values()));
    } catch (e: any) {
      console.warn("Could not fetch drafts from server:", e?.message || e);
      const storeDrafts = storePosts.filter((p) => p.status === "Draft");
      setDrafts(storeDrafts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchDrafts().then(() => { if (!isMounted) return; });
    apiListCampaigns().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        const names = Array.from(new Set(data.map((c: any) => c.name).filter(Boolean)));
        setCampaignsList((prev) => Array.from(new Set([...names, ...prev])));
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [storePosts]);

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
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Form states for Create/Edit Draft
  const [draftContent, setDraftContent] = useState("");
  const [draftPlatforms, setDraftPlatforms] = useState<Platform[]>(["X", "Instagram"]);
  const [draftType, setDraftType] = useState<ContentType>("Text");
  const [draftCampaign, setDraftCampaign] = useState("General");
  const [draftCategory, setDraftCategory] = useState("General");
  const [draftApproval, setDraftApproval] = useState<"Draft" | "Needs Review" | "Approved">("Draft");
  const [draftHashtags, setDraftHashtags] = useState("social, marketing");
  const [draftMediaUrl, setDraftMediaUrl] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleDraftPlatform = (p: Platform) => {
    setDraftPlatforms((prev) =>
      prev.includes(p)
        ? prev.length > 1 ? prev.filter((x) => x !== p) : prev
        : [...prev, p]
    );
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
    idsToDelete.forEach((id) => deleteStorePost(id));
    setDrafts((prev) => prev.filter((d) => !idsToDelete.includes(d.id)));
    showToast(`Deleted ${idsToDelete.length} draft(s)`);

    try {
      for (const id of idsToDelete) {
        const numId = Number(id);
        if (!isNaN(numId)) {
          await apiDeletePost(numId).catch(() => {});
        }
      }
    } catch (e) {
      console.warn("Bulk delete notice:", e);
    }
  };

  const deletePost = async (id: string) => {
    deleteStorePost(id);
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    showToast("Draft deleted");

    try {
      const numId = Number(id);
      if (!isNaN(numId)) {
        await apiDeletePost(numId).catch((err) => {
          console.warn("Delete draft notice:", err);
        });
      }
    } catch (e) {
      console.warn("Delete draft notice:", e);
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

  const handlePublishNow = async (draftToPublish: SocialPost) => {
    const id = draftToPublish.id;
    const nowIso = new Date().toISOString();

    try {
      const numId = Number(id);
      if (!isNaN(numId)) {
        await apiUpdatePost(numId, { status: "Published", scheduled_time: nowIso });
        await apiQueuePublish(numId).catch(() => {});
      } else {
        const backendPost = await apiCreatePost({
          content: draftToPublish.content,
          platform: draftToPublish.platform.toLowerCase() === "x" ? "twitter" : draftToPublish.platform.toLowerCase(),
          status: "published",
          content_type: (draftToPublish.contentType || "Text").toLowerCase(),
          scheduled_time: nowIso,
          media_urls: draftToPublish.media?.map((m) => m.url) || [],
          draft_metadata: {
            contentType: draftToPublish.contentType,
            campaign: draftToPublish.campaign || "General",
            hashtags: draftToPublish.hashtags || [],
          },
        });
        if (backendPost && backendPost.id) {
          await apiQueuePublish(backendPost.id).catch(() => {});
        }
      }
    } catch (e) {
      console.warn("Backend publish request warning:", e);
    }

    updatePostStatus(id, "Published");
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    showToast("Post published live!");
  };

  const openInComposer = (
    content: string,
    platforms: Platform[],
    type: ContentType = "Text",
    camp: string = "General",
    tags: string[] | string = []
  ) => {
    if (typeof window !== "undefined") {
      const parsedTags = Array.isArray(tags)
        ? tags
        : tags.split(",").map((s) => s.trim()).filter(Boolean);

      const composerDraft = {
        texts: { default: content },
        contentType: type,
        selectedPlatforms: platforms.length > 0 ? platforms : ["X"],
        hashtags: parsedTags,
        campaign: camp || "General",
        mode: "Scheduled",
        date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        time: "12:00",
        recurring: false,
        recurringType: "Weekly",
      };

      localStorage.setItem("sp_create_post_draft", JSON.stringify(composerDraft));
    }
    router.push("/create");
  };

  const handleOpenEdit = (post: SocialPost) => {
    setEditModalPost(post);
    setDraftContent(post.content);
    setDraftPlatforms([post.platform]);
    setDraftType(post.contentType);
    setDraftCampaign(post.campaign || "General");
    setDraftCategory(post.category || "General");
    setDraftApproval(post.approvalStatus || "Draft");
    setDraftHashtags((post.hashtags || []).join(", "));
    setDraftMediaUrl(post.media?.[0]?.url || "");
  };

  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);

  const handleSaveEdit = async () => {
    if (!editModalPost || isSubmittingDraft) return;
    setIsSubmittingDraft(true);
    const firstPlat = draftPlatforms[0] || "X";
    try {
      await apiUpdatePost(Number(editModalPost.id), {
        content: draftContent,
        platform: firstPlat.toLowerCase() === "x" ? "twitter" : firstPlat.toLowerCase(),
        media_urls: draftMediaUrl ? [draftMediaUrl] : [],
        draft_metadata: {
           contentType: draftType,
           campaign: draftCampaign,
           category: draftCategory,
           approvalStatus: draftApproval,
           hashtags: draftHashtags.split(",").map((s) => s.trim()).filter(Boolean),
        }
      });
    } catch (err) {
      console.warn("Backend draft update warning:", err);
    }

    const updatedDraftObj: SocialPost = {
      ...editModalPost,
      content: draftContent,
      platform: firstPlat,
      contentType: draftType,
      campaign: draftCampaign,
      category: draftCategory,
      approvalStatus: draftApproval,
      hashtags: draftHashtags.split(",").map((s) => s.trim()).filter(Boolean),
      media: draftMediaUrl ? [{ url: draftMediaUrl, type: 'image', name: 'media', size: 0 }] : [],
    };

    updateStorePost(updatedDraftObj);

    setDrafts((prev) =>
      prev.map((d) => (d.id === editModalPost.id ? updatedDraftObj : d))
    );
    setEditModalPost(null);
    setIsSubmittingDraft(false);
    showToast("Draft updated successfully!");
  };

  const handleCreateDraft = async () => {
    if (!draftContent.trim() || draftPlatforms.length === 0 || isSubmittingDraft) return;
    setIsSubmittingDraft(true);

    const createdDraftItems: SocialPost[] = [];

    try {
      for (const p of draftPlatforms) {
        let createdPostId = (Date.now() + Math.floor(Math.random() * 10000)).toString();
        let createdTime = new Date().toISOString();

        try {
          const res = await apiCreatePost({
            content: draftContent,
            platform: p.toLowerCase() === "x" ? "twitter" : p.toLowerCase(),
            status: "draft",
            content_type: draftType.toLowerCase(),
            media_urls: draftMediaUrl ? [draftMediaUrl] : [],
            draft_metadata: {
              contentType: draftType,
              campaign: draftCampaign || "General",
              category: draftCategory,
              approvalStatus: draftApproval,
              hashtags: draftHashtags.split(",").map((s) => s.trim()).filter(Boolean),
            }
          });
          if (res && res.id) {
            createdPostId = res.id.toString();
            if (res.created_at) createdTime = res.created_at;
          }
        } catch (apiErr: any) {
          console.warn("Backend creation failed, preserving draft locally:", apiErr);
        }

        createdDraftItems.push({
          id: createdPostId,
          content: draftContent,
          contentType: draftType,
          platform: p,
          status: "Draft",
          scheduledAt: null,
          createdAt: createdTime,
          media: draftMediaUrl ? [{ url: draftMediaUrl, type: 'image', name: 'media', size: 0 }] : [],
          campaign: draftCampaign || "General",
          hashtags: draftHashtags.split(",").map((s) => s.trim()).filter(Boolean),
          category: draftCategory,
          recurring: false,
        });
      }

      addStorePosts(createdDraftItems);
      setDrafts((prev) => [...createdDraftItems, ...prev]);
      setCreateDraftModalOpen(false);
      setDraftContent("");
      setDraftMediaUrl("");
      showToast(`Created ${createdDraftItems.length} draft(s) successfully!`);
    } catch (e: any) {
      showToast("Could not create draft: " + (e?.message || "Unknown error"));
    } finally {
      setIsSubmittingDraft(false);
    }
  };

  const firstPlat = draftPlatforms[0] || "X";
  const currentLimit = platformIcons[firstPlat]?.limit || 280;
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
            {filteredDrafts.length} {filteredDrafts.length === 1 ? "Draft" : "Drafts"}
          </div>
        </div>
      </div>

      {/* Grid View */}
      {filteredDrafts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrafts.map((draft) => {
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
                      onClick={() => handlePublishNow(draft)}
                      className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 transition-all cursor-pointer"
                      title="Publish Now"
                    >
                      <Send size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openInComposer(draft.content, [draft.platform], draft.contentType, draft.campaign, draft.hashtags)}
                      className="p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 transition-all cursor-pointer"
                      title="Open in Full Composer"
                    >
                      <Globe size={14} />
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
              {/* Draft Content Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-white/70">Draft Content</label>
                  <button
                    type="button"
                    onClick={() => setAiModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[11px] font-bold shadow-md shadow-violet-900/30 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 animate-pulse" /> AI Assistant
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="Write your post draft idea..."
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-white/5 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-white/30 resize-none ${
                    isOverLimit ? "border-rose-500 focus:ring-rose-500" : "border-white/10"
                  }`}
                />
                <div className="flex items-center justify-between text-[11px] mt-1 font-semibold">
                  <span className={isOverLimit ? "text-rose-400" : "text-white/40"}>
                    {charsUsed} / {currentLimit} max chars ({firstPlat})
                  </span>
                  {isOverLimit && <span className="text-rose-400 font-bold">Exceeds limit!</span>}
                </div>
              </div>

              {/* Target Platforms Multi-Select */}
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">Target Social Platforms (Select one or more)</label>
                <div className="flex flex-wrap gap-2">
                  {(["X", "Instagram", "LinkedIn", "Facebook", "YouTube", "Pinterest"] as Platform[]).map((p) => {
                    const active = draftPlatforms.includes(p);
                    const meta = platformIcons[p];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => toggleDraftPlatform(p)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          active
                            ? "bg-violet-600 border-violet-500 text-white shadow-md"
                            : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                        }`}
                      >
                        <Icon size={12} />
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5">Content Type</label>
                  <select
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value as ContentType)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d0920] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    {contentTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
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
                  <label className="block text-xs font-bold text-white/70 mb-1.5">Associated Campaign</label>
                  <select
                    value={draftCampaign}
                    onChange={(e) => setDraftCampaign(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d0920] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    {campaignsList.map((c) => (
                      <option key={c} value={c}>
                        📁 {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5">Approval Workflow</label>
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
                <label className="block text-xs font-bold text-white/70 mb-1.5">Media Image/Video URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={draftMediaUrl}
                  onChange={(e) => setDraftMediaUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">Hashtags (comma separated)</label>
                <input
                  type="text"
                  placeholder="growth, saas, marketing"
                  value={draftHashtags}
                  onChange={(e) => setDraftHashtags(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => openInComposer(draftContent, draftPlatforms, draftType, draftCampaign, draftHashtags)}
                  className="text-xs font-semibold text-violet-400 hover:text-violet-300 underline cursor-pointer"
                >
                  Need rich media uploads? Open Full Post Composer →
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setCreateDraftModalOpen(false);
                  setEditModalPost(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-semibold text-sm border border-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isOverLimit || draftPlatforms.length === 0 || isSubmittingDraft}
                onClick={editModalPost ? handleSaveEdit : handleCreateDraft}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-violet-900/40 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmittingDraft
                  ? "Saving draft..."
                  : editModalPost
                  ? "Save Draft Changes"
                  : `Create ${draftPlatforms.length} Draft(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        initialPrompt={draftContent}
        targetPlatform={draftPlatforms[0] || "X"}
        onInsert={(newContent, newHashtags) => {
          setDraftContent(newContent);
          if (newHashtags && newHashtags.length > 0) {
            const currentTagArr = draftHashtags.split(",").map((s) => s.trim()).filter(Boolean);
            const merged = Array.from(new Set([...currentTagArr, ...newHashtags]));
            setDraftHashtags(merged.join(", "));
          }
          showToast("✨ AI generated copy inserted into draft!");
        }}
      />
    </div>
  );
}
