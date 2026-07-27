"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Eye, Film, Hash, Image as ImageIcon, Layers, Paperclip, Play, Smile, Smartphone, Type, Video, X, Globe, Bookmark, LayoutTemplate } from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin, FaPinterest, FaTwitter, FaYoutube } from "react-icons/fa";
import { ContentType, Platform, PostMedia, PostStatus, SocialPost, usePosts } from "@/lib/postStore";
import { apiCreatePost, apiQueuePublish } from "@/lib/api";

const DRAFT_KEY = "sp_create_post_draft";
const MAX_FILES = 10;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const contentTypes = [
  { name: "Text" as ContentType, icon: Type, hint: "Caption-only post" },
  { name: "Image" as ContentType, icon: ImageIcon, hint: "One image or graphic" },
  { name: "Video" as ContentType, icon: Video, hint: "A video post" },
  { name: "Carousel" as ContentType, icon: Layers, hint: "Two or more images" },
  { name: "Story" as ContentType, icon: Smartphone, hint: "Vertical, short-lived content" },
  { name: "Reel" as ContentType, icon: Film, hint: "Short-form vertical video" },
];

const platforms = [
  { name: "X" as Platform, label: "X (Twitter)", icon: FaTwitter, color: "text-white", bg: "bg-white/15", border: "border-white/20", limit: 280 },
  { name: "Instagram" as Platform, label: "Instagram", icon: FaInstagram, color: "text-[#e4405f]", bg: "bg-[#e4405f]/15", border: "border-[#e4405f]/25", limit: 2200 },
  { name: "LinkedIn" as Platform, label: "LinkedIn", icon: FaLinkedin, color: "text-[#0077b5]", bg: "bg-[#0077b5]/15", border: "border-[#0077b5]/25", limit: 3000 },
  { name: "Facebook" as Platform, label: "Facebook", icon: FaFacebook, color: "text-[#1877f2]", bg: "bg-[#1877f2]/15", border: "border-[#1877f2]/25", limit: 63206 },
  { name: "YouTube" as Platform, label: "YouTube", icon: FaYoutube, color: "text-[#ff0000]", bg: "bg-[#ff0000]/15", border: "border-[#ff0000]/25", limit: 5000 },
  { name: "Pinterest" as Platform, label: "Pinterest", icon: FaPinterest, color: "text-[#bd081c]", bg: "bg-[#bd081c]/15", border: "border-[#bd081c]/25", limit: 500 },
];

const campaigns = ["Summer Launch", "Brand Awareness", "Product Education", "No campaign"];
const emojiGroups = {
  Smileys: "😀 😃 😄 😁 😆 😅 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😎 🤓 🥳 🤗 🤔 🤩 🤭 🤫 🤝 😴 😮 😢 😭 😡 🤯 🤠 👋 👍 👎 👏 🙌 🤝 💪 🙏 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💯 ✨ 🎉 🔥 💥 ✅ ❌ ⭐ 🌟 💫".split(" "),
  Nature: "🌞 🌈 ☀️ 🌙 ⭐ 🌍 🌊 🌸 🌺 🌻 🌿 🍀 🌴 🌳 🍁 🍂 🍃 🐶 🐱 🐼 🦊 🐝 🦋 🐬 🐳 🦄 🐢 🦜".split(" "),
  Food: "🍎 🍉 🍋 🍓 🍒 🍑 🥭 🍍 🥑 🥦 🌽 🍕 🍔 🌮 🍣 🍩 🍪 🎂 🍫 ☕ 🧋 🍷 🥂 🍾".split(" "),
  Activities: "⚽ 🏀 🏈 ⚾ 🎾 🏆 🥇 🎯 🎮 🎨 🎵 🎧 🎬 📸 ✈️ 🚀 🚗 🚲 🏖️ 🏕️ 🎁 💡 🛒 📚".split(" "),
  Objects: "📱 💻 ⌚ 📷 🎥 💬 📧 🔔 🔒 🔑 💰 💳 📈 📊 📝 📌 📍 🗓️ ⏰ ⚙️ 🛠️ 🧠 🔎 💎".split(" "),
};



type ComposerDraft = {
  texts: Record<string, string>; contentType: ContentType; selectedPlatforms: Platform[]; hashtags: string[];
  campaign: string; mode: PostStatus; date: string; time: string; recurring: boolean;
  recurringType?: "Weekly" | "Monthly" | "Yearly";
};

function localDateInputValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function scheduleLabel(date: string, time: string) {
  const value = new Date(`${date}T${time}`);
  if (Number.isNaN(value.getTime())) return "Choose a valid date and time";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(value);
}

function mediaRequirement(contentType: ContentType, media: PostMedia[]) {
  const images = media.filter((item) => item.type === "image").length;
  const videos = media.filter((item) => item.type === "video").length;
  if (contentType === "Text") {
    return media.length > 0 ? "Remove all media for a text post." : "Text posts cannot have media.";
  }
  if (contentType === "Image") {
    if (videos > 0) return "Remove video. Only images are allowed.";
    return images >= 1 ? "Image attached." : "Add at least one image.";
  }
  if (contentType === "Video" || contentType === "Reel") {
    if (images > 0) return "Remove images. Only a video is allowed.";
    if (videos > 1) return "Remove extra videos. Only 1 video is allowed.";
    return videos === 1 ? "Video attached." : "Add exactly one video.";
  }
  if (contentType === "Carousel") {
    if (videos > 0) return "Remove videos. Carousels only support images.";
    return images >= 2 ? `${images} images attached.` : "Add at least two images.";
  }
  return media.length ? "Media attached." : "Add an image or video for your story.";
}

function hasRequiredMedia(contentType: ContentType, media: PostMedia[]) {
  const images = media.filter((item) => item.type === "image").length;
  const videos = media.filter((item) => item.type === "video").length;
  if (contentType === "Text") return media.length === 0;
  if (contentType === "Image") return images >= 1 && videos === 0;
  if (contentType === "Video" || contentType === "Reel") return videos === 1 && images === 0;
  if (contentType === "Carousel") return images >= 2 && videos === 0;
  return media.length > 0;
}

function loadComposerDraft(): ComposerDraft {
  const fallback: ComposerDraft = { texts: { default: "" }, contentType: "Text", selectedPlatforms: ["X", "Instagram"], hashtags: ["launch", "product"], campaign: campaigns[0], mode: "Scheduled", date: localDateInputValue(), time: "12:00", recurring: false, recurringType: "Weekly" };
  if (typeof window === "undefined") return fallback;
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed.text === "string" && !parsed.texts) {
      parsed.texts = { default: parsed.text };
      delete parsed.text;
    }
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

export default function CreatePostView() {
  const router = useRouter();
  const { addPosts } = usePosts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const objectUrls = useRef<string[]>([]);
  const [initialDraft] = useState(loadComposerDraft);
  const [texts, setTexts] = useState<Record<string, string>>(initialDraft.texts || { default: "" });
  const [activeEditTab, setActiveEditTab] = useState<"Default" | Platform>("Default");
  const [contentType, setContentType] = useState<ContentType>(initialDraft.contentType);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(initialDraft.selectedPlatforms);
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>(initialDraft.hashtags);
  const [campaign, setCampaign] = useState(initialDraft.campaign);
  const [mode, setMode] = useState<PostStatus>(initialDraft.mode);
  const [date, setDate] = useState(initialDraft.date);
  const [time, setTime] = useState(initialDraft.time);
  const [recurring, setRecurring] = useState(initialDraft.recurring || false);
  const [recurringType, setRecurringType] = useState<"Weekly" | "Monthly" | "Yearly">(initialDraft.recurringType || "Weekly");
  const [media, setMedia] = useState<PostMedia[]>([]);
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState<Platform>("X");
  const [currentTime] = useState(() => Date.now());

  // Auto-save & Template states
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const [savedTemplates, setSavedTemplates] = useState<Array<ComposerDraft & { id: string; savedAt: string; title: string }>>([]);
  const [showTemplatesDrawer, setShowTemplatesDrawer] = useState(false);

  // Drag and Drop state
  // Drag and Drop state
  const [isDragging, setIsDragging] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
      setShowPreview(true);
    }
  }, []);

  useEffect(() => () => objectUrls.current.forEach(URL.revokeObjectURL), []);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) setShowEmojiPicker(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setShowEmojiPicker(false); };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("mousedown", closeOnOutsideClick); document.removeEventListener("keydown", closeOnEscape); };
  }, [showEmojiPicker]);

  const draft = useMemo<ComposerDraft>(() => ({ texts, contentType, selectedPlatforms, hashtags, campaign, mode, date, time, recurring, recurringType }), [texts, contentType, selectedPlatforms, hashtags, campaign, mode, date, time, recurring, recurringType]);
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    const timeStr = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTimeout(() => {
      setLastSavedTime(timeStr);
    }, 0);
  }, [draft]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sp_saved_templates");
      if (saved) {
        setTimeout(() => {
          setSavedTemplates(JSON.parse(saved!));
        }, 0);
      }
    } catch {}
  }, []);

  const hasAnyText = useMemo(() => Object.values(texts).some(t => t && t.trim().length > 0), [texts]);
  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => { if (hasAnyText || media.length) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [media.length, hasAnyText]);

  const previewPlatforms = useMemo(() => platforms.filter((item) => selectedPlatforms.includes(item.name)), [selectedPlatforms]);
  const activePreviewName = selectedPlatforms.includes(previewPlatform) ? previewPlatform : selectedPlatforms[0];
  const activePreview = platforms.find((item) => item.name === activePreviewName) ?? previewPlatforms[0];

  const activeLimit = useMemo(() => {
    if (activeEditTab === "Default") {
      return Math.min(...previewPlatforms.map((item) => item.limit), 280);
    }
    const plat = platforms.find(p => p.name === activeEditTab);
    return plat ? plat.limit : 280;
  }, [activeEditTab, previewPlatforms]);

  const currentTabValue = texts[activeEditTab === "Default" ? "default" : activeEditTab] ?? "";

  const scheduledValue = new Date(`${date}T${time}`);
  const hasValidSchedule = mode !== "Scheduled" || (!Number.isNaN(scheduledValue.getTime()) && scheduledValue.getTime() > currentTime);

  const hasContentForAllSelected = selectedPlatforms.length > 0 && selectedPlatforms.every(p => {
    const pText = texts[p]?.trim() || texts.default.trim();
    return pText.length > 0;
  });

  const hasLimitViolations = selectedPlatforms.some(p => {
    const pText = texts[p]?.trim() || texts.default.trim();
    const plat = platforms.find(item => item.name === p);
    return plat ? pText.length > plat.limit : false;
  });

  const canSubmit = hasContentForAllSelected && !hasLimitViolations && hasRequiredMedia(contentType, media) && hasValidSchedule;

  function togglePlatform(platform: Platform) {
    setSelectedPlatforms((current) => {
      const next = current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform];
      if (activeEditTab === platform && !next.includes(platform)) {
        setActiveEditTab("Default");
      }
      return next;
    });
  }
  function addHashtag() {
    const clean = hashtagInput.trim().replace(/^#/, "").replace(/\s/g, "");
    if (!clean || hashtags.some((tag) => tag.toLowerCase() === clean.toLowerCase())) return;
    setHashtags((current) => [...current, clean]); setHashtagInput("");
  }
  function insertEmoji(emoji: string) {
    const key = activeEditTab === "Default" ? "default" : activeEditTab;
    const currentVal = texts[key] ?? texts.default;
    setTexts((prev) => ({
      ...prev,
      [key]: `${currentVal}${currentVal ? " " : ""}${emoji}`
    }));
    setShowEmojiPicker(false);
  }
  function openFilePicker() { fileInputRef.current?.click(); }

  function attachFiles(files: File[]) {
    const available = MAX_FILES - media.length;
    const accepted = files.slice(0, Math.max(0, available)).filter((file) => file.size <= MAX_FILE_SIZE && (file.type.startsWith("image/") || file.type.startsWith("video/")));
    const rejected = files.length - accepted.length;
    const attachments = accepted.map((file) => {
      const url = URL.createObjectURL(file); objectUrls.current.push(url);
      return { name: file.name, type: file.type.startsWith("video/") ? "video" as const : "image" as const, url, size: file.size };
    });
    setMedia((current) => [...current, ...attachments]);
    setMessage(rejected ? `${attachments.length} file(s) attached. Unsupported, oversized, or excess files were skipped.` : `${attachments.length} file(s) attached.`);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    attachFiles(files);
    event.target.value = "";
  }
  function removeMedia(index: number) {
    setMedia((current) => { const item = current[index]; if (item) { URL.revokeObjectURL(item.url); objectUrls.current = objectUrls.current.filter((url) => url !== item.url); } return current.filter((_, itemIndex) => itemIndex !== index); });
  }
  function resetComposer(preserveMediaUrls = false) {
    if (!preserveMediaUrls) media.forEach((item) => URL.revokeObjectURL(item.url));
    if (!preserveMediaUrls) objectUrls.current = [];
    setTexts({ default: "" }); setHashtags([]); setHashtagInput(""); setMedia([]); localStorage.removeItem(DRAFT_KEY);
    setActiveEditTab("Default");
    setRecurring(false);
    setRecurringType("Weekly");
  }
  async function submitPost(nextMode = mode) {
    const isFutureSchedule = nextMode !== "Scheduled" || (!Number.isNaN(scheduledValue.getTime()) && scheduledValue.getTime() > Date.now());
    if (!canSubmit || !isFutureSchedule) {
      setMessage(!isFutureSchedule ? "Choose a future date and time." : !hasRequiredMedia(contentType, media) ? mediaRequirement(contentType, media) : "Ensure all platforms have valid content and do not exceed character limits.");
      return;
    }
    const createdAt = new Date().toISOString();
    const scheduledAt = nextMode === "Published" ? createdAt : nextMode === "Scheduled" ? scheduledValue.toISOString() : null;

    setIsSubmitting(true);
    setMessage("Processing post...");

    try {
      // Create backend post for each selected platform
      for (const platform of selectedPlatforms) {
        const pText = texts[platform]?.trim() || texts.default.trim();
        
        // 1. Create Post
        const createdPost = await apiCreatePost({
          content: pText,
          // UI uses "X" but backend stores/dispatches as "twitter"
          platform: platform.toLowerCase() === "x" ? "twitter" : platform.toLowerCase(),
          // 'Published' mode = queue immediately; 'published' status is set AFTER platform confirms
          status: nextMode.toLowerCase() === "published" ? "queued" : nextMode.toLowerCase(),
          content_type: contentType.toLowerCase(),
          scheduled_time: scheduledAt,
          media_urls: [],
          draft_metadata: {
            contentType,
            campaign,
            hashtags,
            recurring,
            recurringType: recurring ? recurringType : undefined,
          }
        });

        // 2. Queue Publish if scheduled
        if (nextMode === "Scheduled" || nextMode === "Published") {
          await apiQueuePublish(createdPost.id);
        }
      }

      // Cleanup local object URLs
      objectUrls.current = objectUrls.current.filter((url) => !media.some((item) => item.url === url));
      resetComposer(true);
      router.push(nextMode === "Draft" ? "/drafts" : "/calendar");
    } catch (err: any) {
      setMessage(`Failed to process post: ${err.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  }
  function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); submitPost(mode); }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    attachFiles(files);
  };

  // Clipboard paste handler
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files);
    if (files.length > 0) {
      e.preventDefault();
      attachFiles(files);
    }
  };

  // Suggest time slots
  const suggestTime = (slot: "commute" | "business" | "evening") => {
    const suggested = new Date();
    if (slot === "commute") {
      suggested.setHours(17, 0, 0, 0); // 5:00 PM
      if (suggested.getTime() <= currentTime) {
        suggested.setDate(suggested.getDate() + 1);
      }
    } else if (slot === "business") {
      suggested.setDate(suggested.getDate() + 1);
      suggested.setHours(9, 0, 0, 0); // 9:00 AM
    } else if (slot === "evening") {
      suggested.setHours(20, 0, 0, 0); // 8:00 PM
      if (suggested.getTime() <= currentTime) {
        suggested.setDate(suggested.getDate() + 1);
      }
    }
    const dVal = `${suggested.getFullYear()}-${String(suggested.getMonth() + 1).padStart(2, "0")}-${String(suggested.getDate()).padStart(2, "0")}`;
    const tVal = `${String(suggested.getHours()).padStart(2, "0")}:${String(suggested.getMinutes()).padStart(2, "0")}`;
    setDate(dVal);
    setTime(tVal);
    setMessage(`Applied suggested slot: ${slot === "commute" ? "Peak Commute (5:00 PM)" : slot === "business" ? "Business Hours (9:00 AM)" : "Evening Rush (8:00 PM)"}`);
  };

  const getUTCTimeString = (dStr: string, tStr: string) => {
    const val = new Date(`${dStr}T${tStr}`);
    if (Number.isNaN(val.getTime())) return "";
    return val.toUTCString();
  };

  const saveAsTemplate = () => {
    const title = `Template ${savedTemplates.length + 1} (${selectedPlatforms.join(", ")})`;
    const newTemplate = {
      id: crypto.randomUUID(),
      savedAt: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      title,
      texts,
      contentType,
      selectedPlatforms,
      hashtags,
      campaign,
      mode,
      date,
      time,
      recurring,
      recurringType,
    };
    const next = [...savedTemplates, newTemplate];
    setSavedTemplates(next);
    localStorage.setItem("sp_saved_templates", JSON.stringify(next));
    setMessage(`Saved current draft as template: "${title}"`);
  };

  const renderPreviewMedia = (platformName: string) => {
    if (media.length === 0) {
      if (platformName === "Instagram") {
        return (
          <div className="w-full text-[11px] text-white/30 py-12 flex flex-col items-center justify-center gap-2 bg-[#0b0717]">
            <ImageIcon className="w-6 h-6" />
            <span>Image or Video Preview</span>
          </div>
        );
      }
      if (platformName === "Pinterest") {
        return (
          <div className="w-full text-[11px] text-white/30 py-12 flex flex-col items-center justify-center gap-2 bg-[#0b0717]">
            <ImageIcon className="w-6 h-6" />
            <span>Rounded Pin Media Preview</span>
          </div>
        );
      }
      if (platformName === "YouTube") {
        return (
          <div className="w-full text-[11px] text-white/30 py-12 flex flex-col items-center justify-center gap-2 bg-neutral-900">
            <div className="w-12 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold mx-auto mb-1">
              ▶
            </div>
            <span>Upload Video for YouTube preview</span>
          </div>
        );
      }
      return null;
    }

    if (media.length > 1) {
      return (
        <div className="w-full relative bg-black flex overflow-x-auto scrollbar-thin snap-x snap-mandatory gap-0.5 custom-scrollbar">
          {media.map((item, idx) => (
            <div key={`${item.url}-${idx}`} className="w-full aspect-[4/3] shrink-0 snap-center relative flex items-center justify-center bg-black">
              {item.type === "video" ? (
                <video src={item.url} className="w-full h-full object-contain" />
              ) : (
                <img src={item.url} alt={`Media ${idx + 1}`} className="w-full h-full object-contain" />
              )}
              <span className="absolute bottom-3 right-3 bg-black/75 text-[10px] px-2 py-0.5 rounded-full font-semibold text-white/90">
                {idx + 1} of {media.length}
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
          <video src={item.url} className="w-full h-full object-contain animate-fade-in" />
        ) : (
          <img src={item.url} alt="Media" className="w-full h-full object-contain animate-fade-in" />
        )}
      </div>
    );
  };

  const renderHighFidelityPreview = () => {
    if (!activePreview) return null;
    const previewText = texts[activePreview.name] ?? texts.default;

    if (activePreview.name === "X") {
      return (
        <div className="p-4 flex gap-3 text-white leading-normal">
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
              {previewText || "X Post"}
            </p>
            {hashtags.length > 0 && (
              <p className="text-[13.5px] text-violet-400 mt-1.5 break-words">
                {hashtags.map((tag) => `#${tag}`).join(" ")}
              </p>
            )}
            {media.length > 0 && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black">
                {renderPreviewMedia("X")}
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

    if (activePreview.name === "Instagram") {
      return (
        <div className="text-white leading-normal flex flex-col">
          <div className="p-3.5 flex items-center gap-3 border-b border-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[1.5px] shrink-0">
              <div className="w-full h-full rounded-full bg-[#0b0717] flex items-center justify-center text-[10px] font-bold text-white">
                SP
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-white">socialpilot</p>
              <p className="text-[9px] text-white/45">Bengaluru, Bengaluru</p>
            </div>
          </div>
          <div className="w-full bg-black flex flex-col items-center justify-center">
            {renderPreviewMedia("Instagram")}
          </div>
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
              <span className="text-white/85 whitespace-pre-wrap break-words">{previewText || "Instagram caption..."}</span>
            </p>
            {hashtags.length > 0 && (
              <p className="text-xs text-blue-450 break-words">
                {hashtags.map((tag) => `#${tag}`).join(" ")}
              </p>
            )}
            <p className="text-[9px] text-white/40 uppercase tracking-wide">1 hour ago</p>
          </div>
        </div>
      );
    }

    if (activePreview.name === "LinkedIn") {
      return (
        <div className="p-4 text-white leading-normal flex flex-col">
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
                <span>1h • Edited •</span>
                <span>🌐</span>
              </p>
            </div>
          </div>
          <p className="text-xs text-white/90 whitespace-pre-wrap break-words leading-relaxed mb-3">
            {previewText || "LinkedIn post content..."}
          </p>
          {hashtags.length > 0 && (
            <p className="text-xs text-indigo-400 break-words mb-3">
              {hashtags.map((tag) => `#${tag}`).join(" ")}
            </p>
          )}
          {media.length > 0 && (
            <div className="rounded-lg overflow-hidden border border-white/10 bg-black mb-3">
              {renderPreviewMedia("LinkedIn")}
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

    if (activePreview.name === "Facebook") {
      return (
        <div className="p-4 text-white leading-normal flex flex-col">
          <div className="flex gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-neutral-800 shrink-0 flex items-center justify-center font-bold text-xs border border-white/5">
              SP
            </div>
            <div>
              <p className="font-bold text-xs text-white">SocialPilot</p>
              <p className="text-[10px] text-white/40 flex items-center gap-1">
                <span>Just now •</span>
                <span>🌎</span>
              </p>
            </div>
          </div>
          <p className="text-xs text-white/90 whitespace-pre-wrap break-words leading-relaxed mb-3">
            {previewText || "Facebook post..."}
          </p>
          {hashtags.length > 0 && (
            <p className="text-xs text-blue-400 break-words mb-3">
              {hashtags.map((tag) => `#${tag}`).join(" ")}
            </p>
          )}
          {media.length > 0 && (
            <div className="overflow-hidden border-y border-white/10 bg-black -mx-4 mb-3">
              {renderPreviewMedia("Facebook")}
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

    if (activePreview.name === "Pinterest") {
      return (
        <div className="text-white leading-normal flex flex-col">
          <div className="p-3 flex justify-between items-center">
            <span className="text-lg">🔗</span>
            <button type="button" className="px-4 py-1.5 bg-[#bd081c] text-white text-xs font-bold rounded-full hover:bg-[#a60718] transition-all">
              Save
            </button>
          </div>
          <div className="px-4 bg-black flex items-center justify-center">
            <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0b0717]">
              {renderPreviewMedia("Pinterest")}
            </div>
          </div>
          <div className="p-4 space-y-2">
            <h4 className="font-extrabold text-sm leading-tight truncate">
              {previewText || "Pin Title"}
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

    if (activePreview.name === "YouTube") {
      const isVideoType = contentType === "Video" || contentType === "Reel";
      if (isVideoType) {
        return (
          <div className="text-white leading-normal flex flex-col bg-black/40">
            <div className="relative w-full aspect-video bg-neutral-900 border-b border-white/5 flex items-center justify-center">
              {renderPreviewMedia("YouTube")}
              {media.length === 0 && (
                <span className="absolute bottom-2 right-2 bg-black/85 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                  2:34
                </span>
              )}
            </div>
            <div className="p-4 space-y-2.5">
              <h4 className="font-bold text-sm leading-snug line-clamp-2">
                {previewText || "Video Title | SocialPilot"}
              </h4>
              <p className="text-[10px] text-white/40 leading-none">
                0 views · Just now · {hashtags.map((tag) => `#${tag}`).join(" ")}
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

      // Community Post format for Text / Image / Carousel
      return (
        <div className="p-4 text-white leading-normal flex flex-col bg-[#0b0717]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold border border-white/5">
                SP
              </div>
              <div>
                <p className="font-bold text-xs text-white">SocialPilot</p>
                <p className="text-[10px] text-white/40">Community Post</p>
              </div>
            </div>
            <span className="text-white/30 text-xs font-bold">⋮</span>
          </div>
          <p className="text-xs text-white/90 whitespace-pre-wrap break-words leading-relaxed mb-3">
            {previewText || "YouTube Community post text..."}
          </p>
          {hashtags.length > 0 && (
            <p className="text-xs text-blue-400 break-words mb-3">
              {hashtags.map((tag) => `#${tag}`).join(" ")}
            </p>
          )}
          {media.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-white/10 bg-black mb-3">
              {renderPreviewMedia("YouTube")}
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

    return null;
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-transparent overflow-hidden">
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-none w-full">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-6 md:p-10 pb-32 flex flex-col gap-8">
          <section>
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 block">Content type</label>
            <div className="flex flex-wrap gap-2">{contentTypes.map((type) => { const Icon = type.icon; const active = contentType === type.name; return <button type="button" key={type.name} title={type.hint} onClick={() => setContentType(type.name)} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${active ? "bg-violet-600 border-violet-500 text-white" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"}`}><Icon className="w-4 h-4" />{type.name}</button>; })}</div>
            <p className="text-xs text-white/40 mt-2">{contentTypes.find((type) => type.name === contentType)?.hint}. {mediaRequirement(contentType, media)}</p>
          </section>

          <section>
            <div className="flex items-center justify-between gap-4 mb-3"><label className="text-xs font-bold text-white/40 uppercase tracking-wider">Target platforms</label><span className="text-xs text-white/35">Account connection will be verified when publishing.</span></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                const active = selectedPlatforms.includes(platform.name);
                return (
                  <button
                    type="button"
                    aria-pressed={active}
                    key={platform.name}
                    onClick={() => togglePlatform(platform.name)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      active
                        ? `${platform.bg} ${platform.border} text-white`
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : platform.color}`} />
                      <span className="truncate">{platform.label}</span>
                    </span>
                    {active && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </section>

          <section
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative border border-white/10 rounded-xl overflow-visible focus-within:ring-2 focus-within:ring-violet-500 transition-all bg-white/5"
          >
            {/* Drag and Drop Active Overlay */}
            {isDragging && (
              <div className="absolute inset-0 z-30 bg-violet-950/40 backdrop-blur-md border-2 border-dashed border-violet-500 rounded-xl flex flex-col items-center justify-center gap-2 pointer-events-none transition-all">
                <ImageIcon className="w-8 h-8 text-violet-400 animate-bounce" />
                <span className="text-sm font-bold text-white">Drop files to attach</span>
                <span className="text-[10px] text-white/40">Images or Videos up to 25MB</span>
              </div>
            )}

            {/* Platform Tabs Switcher */}
            <div className="flex border-b border-white/10 bg-white/[0.02] rounded-t-xl overflow-x-auto px-3 py-2 gap-1.5 scrollbar-thin">
              <button
                type="button"
                onClick={() => setActiveEditTab("Default")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeEditTab === "Default"
                    ? "bg-violet-600/20 border border-violet-500/30 text-violet-300"
                    : "border border-transparent text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                Default
              </button>
              {previewPlatforms.map((platform) => {
                const Icon = platform.icon;
                const hasOverride = typeof texts[platform.name] === "string";
                const isOverLimit = (texts[platform.name] ?? texts.default).length > platform.limit;
                return (
                  <button
                    type="button"
                    key={platform.name}
                    onClick={() => setActiveEditTab(platform.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      activeEditTab === platform.name
                        ? "bg-violet-600/20 border border-violet-500/30 text-violet-300"
                        : "border border-transparent text-white/50 hover:text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <Icon className={platform.color} />
                    <span>{platform.name}</span>
                    {hasOverride && (
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" title="Custom override set" />
                    )}
                    {isOverLimit && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="Over limit!" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Override status indicator bar */}
            {activeEditTab === "Default" ? (
              texts.default.trim().length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 bg-violet-950/15 border-b border-white/5 text-[11px] text-white/40">
                  <span>Editing default caption. Applies to all selected channels.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTexts((prev) => ({ ...prev, default: "" }));
                    }}
                    className="text-red-400 hover:text-red-300 font-bold hover:underline cursor-pointer"
                  >
                    Clear Caption
                  </button>
                </div>
              )
            ) : (
              <div className="flex items-center justify-between px-4 py-2 bg-violet-950/15 border-b border-white/5 text-[11px] text-white/40">
                <span>
                  {typeof texts[activeEditTab] === "string"
                    ? `Custom override set for ${activeEditTab}.`
                    : `Showing default text. Edit caption below to customize for ${activeEditTab}.`}
                </span>
                {typeof texts[activeEditTab] === "string" && (
                  <button
                    type="button"
                    onClick={() => {
                      setTexts(prev => {
                        const copy = { ...prev };
                        delete copy[activeEditTab];
                        return copy;
                      });
                    }}
                    className="text-violet-400 hover:text-violet-300 font-bold hover:underline"
                  >
                    Reset to Default
                  </button>
                )}
              </div>
            )}

            <label htmlFor="post-caption" className="sr-only">Post caption</label>
            <textarea
              id="post-caption"
              onPaste={handlePaste}
              className="w-full p-4 h-40 resize-none focus:outline-none text-white bg-transparent placeholder:text-white/30"
              placeholder={activeEditTab === "Default" ? "Write your default caption here..." : `Write override for ${activeEditTab}...`}
              value={activeEditTab === "Default" ? texts.default : (texts[activeEditTab] ?? texts.default)}
              maxLength={activeLimit}
              onChange={(event) => {
                const val = event.target.value;
                setTexts((prev) => ({
                  ...prev,
                  [activeEditTab === "Default" ? "default" : activeEditTab]: val,
                }));
              }}
            />
            {media.length > 0 && <div className="flex gap-3 p-3 bg-white/5 border-y border-white/10 overflow-x-auto">{media.map((item, index) => <div key={`${item.url}-${index}`} className="relative w-20 h-20 shrink-0"><MediaThumb media={item} /><button type="button" aria-label={`Remove ${item.name}`} onClick={() => removeMedia(index)} className="absolute -top-2 -right-2 bg-black/85 text-white rounded-full p-1 shadow hover:bg-black"><X className="w-3.5 h-3.5" /></button></div>)}</div>}
            <div className="p-3 bg-white/5 flex items-center justify-between gap-2 relative">
              <div className="flex items-center gap-1">
                <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*" onChange={handleFileChange} />
                <IconButton label="Add image or video" onClick={openFilePicker}><ImageIcon className="w-4 h-4" /></IconButton>
                <IconButton label="Attach a file" onClick={openFilePicker}><Paperclip className="w-4 h-4" /></IconButton>
                <IconButton label="Add emoji" onClick={() => setShowEmojiPicker((current) => !current)} pressed={showEmojiPicker}><Smile className="w-4 h-4" /></IconButton>
                <IconButton label="Add a hashtag" onClick={() => document.getElementById("hashtag-input")?.focus()}><Hash className="w-4 h-4" /></IconButton>
                <IconButton label="Save as template" onClick={saveAsTemplate}><Bookmark className="w-4 h-4 text-violet-400" /></IconButton>
                <IconButton label="Load templates" onClick={() => setShowTemplatesDrawer(true)}><LayoutTemplate className="w-4 h-4 text-cyan-400" /></IconButton>
                <IconButton label={showPreview ? "Hide live preview" : "Show live preview"} onClick={() => setShowPreview((current) => !current)}><Eye className="w-4 h-4" /></IconButton>
              </div>
              <div className="flex items-center gap-3">
                {lastSavedTime && (
                  <span className="text-[10px] text-white/30">Auto-saved at {lastSavedTime}</span>
                )}
                <span className={`text-xs font-medium ${currentTabValue.length > activeLimit - 30 ? "text-red-400" : "text-white/40"}`}>
                  {activeLimit - currentTabValue.length} remaining
                </span>
              </div>
              {showEmojiPicker && (
                <div ref={emojiPickerRef} className="absolute z-40 left-2 top-full mt-2 w-[min(18rem,calc(100vw-2.5rem))] max-h-64 overflow-y-auto pt-0 pb-3 rounded-xl border border-white/10 bg-[#110c24] shadow-2xl custom-scrollbar">
                  <div className="sticky top-0 z-20 inset-x-0 flex items-center justify-between gap-3 pt-3 mb-2 pb-2 border-b border-white/10 bg-[#110c24]">
                    <span className="text-xs font-bold text-white/60">Emoji picker</span>
                    <button type="button" aria-label="Close emoji picker" onClick={() => setShowEmojiPicker(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  {Object.entries(emojiGroups).map(([group, emojis]) => (
                    <div key={group} className="mb-3 last:mb-0 px-3">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-white/35 mb-1">{group}</p>
                      <div className="grid grid-cols-10 gap-1">
                        {emojis.map((emoji, index) => <button type="button" key={`${group}-${index}`} aria-label={`Add ${emoji}`} onClick={() => insertEmoji(emoji)} className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-base leading-none transition-colors duration-150 hover:bg-white/10">{emoji}</button>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-8 md:grid-cols-[1fr_0.72fr]">
            <div><label htmlFor="hashtag-input" className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 block">Hashtags</label><div className="flex gap-2"><div className="flex-1 relative"><Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" /><input id="hashtag-input" type="text" value={hashtagInput} onChange={(event) => setHashtagInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addHashtag(); } }} placeholder="Type a hashtag and press Enter" className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-white/30 text-white" /></div><button type="button" onClick={addHashtag} className="px-4 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm font-bold">Add</button></div><div className="flex flex-wrap gap-2 mt-3">{hashtags.map((tag) => <button type="button" key={tag} aria-label={`Remove hashtag ${tag}`} onClick={() => setHashtags((current) => current.filter((item) => item !== tag))} className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-full text-xs font-semibold">#{tag}<X className="w-3.5 h-3.5" /></button>)}</div></div>
            <div><label htmlFor="campaign" className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 block">Campaign</label><select id="campaign" value={campaign} onChange={(event) => setCampaign(event.target.value)} className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-white">{campaigns.map((item) => <option key={item} className="bg-[#05030e] text-white">{item}</option>)}</select></div>
          </section>

          <section className="border border-white/10 rounded-xl overflow-hidden"><div className="grid grid-cols-3 border-b border-white/10 text-sm font-medium text-center">{(["Published", "Scheduled", "Draft"] as PostStatus[]).map((item) => <button type="button" key={item} onClick={() => setMode(item)} className={`p-3 transition-colors ${mode === item ? "border-b-2 border-violet-500 text-white bg-white/10" : "text-white/40 hover:bg-white/5"}`}>{item === "Published" ? "Publish now" : item === "Draft" ? "Save draft" : "Schedule"}</button>)}</div>{mode === "Scheduled" && <div className="p-5 bg-white/5 space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-6"><div><label htmlFor="schedule-date" className="text-xs font-bold text-white/40 mb-2 block">Date</label><input id="schedule-date" type="date" min={localDateInputValue()} value={date} onChange={(event) => setDate(event.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-white" /></div><div><label htmlFor="schedule-time" className="text-xs font-bold text-white/40 mb-2 block">Time</label><input id="schedule-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-white" /></div></div>
          
            {/* Suggested Slots Row */}
            <div className="space-y-2 border-t border-white/5 pt-4">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Suggest best slot</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "commute" as const, label: "🚀 Commute (5 PM)" },
                  { key: "business" as const, label: "💼 Business (9 AM)" },
                  { key: "evening" as const, label: "🌙 Evening (8 PM)" }
                ].map((slot) => (
                  <button
                    type="button"
                    key={slot.key}
                    onClick={() => suggestTime(slot.key)}
                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-white/70 hover:text-white transition-all cursor-pointer"
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>

            <p className={`text-xs ${hasValidSchedule ? "text-violet-300" : "text-red-400"}`}>{hasValidSchedule ? `Scheduled for ${scheduleLabel(date, time)}` : "Choose a future date and time."}</p>
            
            {/* Timezone Helper Display */}
            {hasValidSchedule && getUTCTimeString(date, time) && (
              <p className="text-[10px] text-white/35 flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>UTC: {getUTCTimeString(date, time)}</span>
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white/80">Repeat post</span>
                <span className="text-[10px] text-white/40">Automatically republish on a recurring interval</span>
              </div>
              <div className="flex items-center gap-4">
                {recurring && (
                  <div className="flex items-center gap-2.5 animate-scale-in">
                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Interval:</span>
                    <select
                      value={recurringType}
                      onChange={(e) => setRecurringType(e.target.value as "Weekly" | "Monthly" | "Yearly")}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 text-white"
                    >
                      <option value="Weekly" className="bg-[#05030e] text-white">Weekly</option>
                      <option value="Monthly" className="bg-[#05030e] text-white">Monthly</option>
                      <option value="Yearly" className="bg-[#05030e] text-white">Yearly</option>
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setRecurring(!recurring)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                    recurring ? 'bg-violet-600' : 'bg-white/10'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      recurring ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>}</section>

          {message && <p role="status" className="text-sm font-medium text-white/75">{message}</p>}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
            <button type="button" disabled={isSubmitting} onClick={() => resetComposer()} className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-sm font-bold transition-all cursor-pointer disabled:opacity-50">
              Discard Draft
            </button>
            <button type="button" disabled={isSubmitting} onClick={() => submitPost("Draft")} className="flex-1 px-6 py-3 bg-white/10 border border-white/10 rounded-lg text-sm font-bold text-white hover:bg-white/20 transition-all cursor-pointer disabled:opacity-50">
              {isSubmitting ? "Processing..." : "Save draft"}
            </button>
            <button type="submit" disabled={!canSubmit || isSubmitting} className="flex-1 flex justify-center items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg text-sm font-bold text-white hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer">
              <Clock className="w-4 h-4" />
              {isSubmitting ? "Processing..." : (mode === "Published" ? "Publish now" : mode === "Draft" ? "Save draft" : "Schedule post")}
            </button>
          </div>
        </form>
      </main>

      {showPreview && (
        <aside
          aria-label="Live post preview"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md lg:static lg:bg-white/5 lg:backdrop-blur-none lg:z-auto w-full lg:w-[360px] lg:border-l border-white/10 flex flex-col h-full animate-fade-in"
        >
          {/* Mobile backdrop click to close */}
          <div
            className="absolute inset-0 lg:hidden -z-10"
            onClick={() => setShowPreview(false)}
          />
          <div className="bg-[#0b0717] lg:bg-transparent flex flex-col h-full max-h-[90vh] lg:max-h-full mt-auto lg:mt-0 rounded-t-2xl lg:rounded-none border-t lg:border-t-0 border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-sm font-bold text-white">Live preview</h2>
                <p className="text-xs text-white/40 mt-0.5">Content is adapted per platform</p>
              </div>
              <button
                type="button"
                aria-label="Close preview"
                onClick={() => setShowPreview(false)}
                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 border-b border-white/10 flex gap-2 overflow-x-auto shrink-0">
              {previewPlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <button
                    type="button"
                    key={platform.name}
                    onClick={() => setPreviewPlatform(platform.name)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                      activePreview?.name === platform.name
                        ? `${platform.bg} ${platform.border} text-white`
                        : "border-white/10 text-white/45 hover:bg-white/5"
                    }`}
                  >
                    <Icon className={platform.color} />
                    {platform.name}
                  </button>
                );
              })}
            </div>
            {activePreview ? (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2 shrink-0 animate-scale-in">
                  <p className="text-xs font-bold text-white/70 mb-3">Publishing checks</p>
                  <PreviewCheck
                    pass={(texts[activePreview.name] ?? texts.default).length <= activePreview.limit}
                    text={`${(texts[activePreview.name] ?? texts.default).length}/${activePreview.limit} characters`}
                  />
                  <PreviewCheck
                    pass={hasRequiredMedia(contentType, media)}
                    text={mediaRequirement(contentType, media)}
                  />
                  <PreviewCheck
                    pass={hasValidSchedule}
                    text={mode === "Scheduled" ? "Future schedule selected" : "No schedule required"}
                  />
                  <p className="text-xs text-white/35 pt-2 border-t border-white/10 mt-2">
                    Multiple platforms may format captions and media differently after publishing.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0b0717] overflow-hidden shrink-0">
                  {renderHighFidelityPreview()}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-white/45">Select a platform to preview.</div>
            )}
          </div>
        </aside>
      )}

      {/* Templates Drawer Overlay */}
      {showTemplatesDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0d0920] border-l border-white/10 p-6 flex flex-col h-full shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-white">Saved Templates</h3>
              <button type="button" onClick={() => setShowTemplatesDrawer(false)} className="text-white/40 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {savedTemplates.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-10">No saved templates yet. Click the bookmark icon to save current composer state as template.</p>
              ) : (
                savedTemplates.map((tpl) => (
                  <div key={tpl.id} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-violet-500/50 transition-all flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white truncate max-w-[180px]">{tpl.title}</span>
                      <span className="text-[10px] text-white/35">{tpl.savedAt}</span>
                    </div>
                    <p className="text-[11px] text-white/50 line-clamp-2">{tpl.texts.default || "Empty default caption"}</p>
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setTexts(tpl.texts);
                          setContentType(tpl.contentType);
                          setSelectedPlatforms(tpl.selectedPlatforms);
                          setHashtags(tpl.hashtags);
                          setCampaign(tpl.campaign);
                          setMode(tpl.mode);
                          if (tpl.date) setDate(tpl.date);
                          if (tpl.time) setTime(tpl.time);
                          setRecurring(tpl.recurring);
                          if (tpl.recurringType) setRecurringType(tpl.recurringType);
                          setShowTemplatesDrawer(false);
                          setMessage(`Loaded template: "${tpl.title}"`);
                        }}
                        className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = savedTemplates.filter(t => t.id !== tpl.id);
                          setSavedTemplates(next);
                          localStorage.setItem("sp_saved_templates", JSON.stringify(next));
                        }}
                        className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconButton({ label, onClick, children, pressed }: { label: string; onClick: () => void; children: React.ReactNode; pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center p-2 rounded-full transition-colors ${pressed ? "text-violet-300 bg-violet-500/15" : "text-white/40 hover:text-white hover:bg-white/10 group"}`}
    >
      {children}
      <span className="absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-full bg-black/90 px-3 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

function MediaThumb({ media }: { media: PostMedia }) {
  return media.type === "video" ? <div className="w-full h-full rounded-md bg-black border border-white/10 flex items-center justify-center"><video src={media.url} className="absolute inset-0 w-full h-full object-cover rounded-md opacity-60" /><Play className="relative w-5 h-5 text-white" /></div> : <img src={media.url} alt={media.name} className="w-full h-full object-cover rounded-md border border-white/10" />;
}

function PreviewCheck({ pass, text }: { pass: boolean; text: string }) {
  return <div className={`flex items-center gap-2 text-xs ${pass ? "text-emerald-300" : "text-amber-300"}`}><span className={`w-4 h-4 rounded-full flex items-center justify-center ${pass ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>{pass ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}</span>{text}</div>;
}