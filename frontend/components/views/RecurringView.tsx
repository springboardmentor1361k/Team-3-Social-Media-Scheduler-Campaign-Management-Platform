"use client";

import { useState, useEffect } from "react";
import {
  Repeat,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  Pause,
  Trash2,
  Edit,
  Globe,
  Sparkles,
  Zap,
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
  RecurrenceFrequency,
} from "@/lib/postStore";
import { apiListRecurringSchedules, apiCreateRecurringSchedule, apiToggleRecurringSchedule, apiDeleteRecurringSchedule } from "@/lib/api";

const availablePlatforms: { key: Platform; label: string; icon: any; color: string }[] = [
  { key: "X", label: "X (Twitter)", icon: FaTwitter, color: "text-white" },
  { key: "Instagram", label: "Instagram", icon: FaInstagram, color: "text-[#e4405f]" },
  { key: "LinkedIn", label: "LinkedIn", icon: FaLinkedin, color: "text-[#0077b5]" },
  { key: "Facebook", label: "Facebook", icon: FaFacebook, color: "text-[#1877f2]" },
  { key: "YouTube", label: "YouTube", icon: FaYoutube, color: "text-[#ff0000]" },
  { key: "Pinterest", label: "Pinterest", icon: FaPinterest, color: "text-[#bd081c]" },
];

const daysList = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const contentTypes: ContentType[] = ["Text", "Image", "Video", "Carousel", "Story", "Reel"];

export default function RecurringView() {
  const [recurringSchedules, setRecurringSchedules] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchSchedules = async () => {
    try {
      const data = await apiListRecurringSchedules();
      setRecurringSchedules(data.map((r: any) => ({
        ...r,
        id: r.id.toString(),
        platforms: r.platforms ? r.platforms.split(',') : [],
        daysOfWeek: r.days_of_week ? r.days_of_week.split(',') : [],
        timeSlot: r.time_slot,
        endCondition: r.end_condition,
        endCount: r.end_count,
        publishedCount: r.published_count || 0,
        nextRunAt: r.next_run_at,
        createdAt: r.created_at
      })));
    } catch(e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState<ContentType>("Text");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["X", "LinkedIn"]);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("Weekly");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Wed"]);
  const [timeSlot, setTimeSlot] = useState("09:00");
  const [endCondition, setEndCondition] = useState<"Never" | "AfterCount" | "OnDate">("Never");
  const [endCount, setEndCount] = useState(10);
  const [campaign, setCampaign] = useState("Recurring Campaign");
  const [hashtags, setHashtags] = useState("automation, social");

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleCreateSchedule = async () => {
    if (!title.trim() || !content.trim() || selectedPlatforms.length === 0) return;

    await apiCreateRecurringSchedule({
      title,
      content,
      content_type: contentType,
      platforms: selectedPlatforms,
      frequency,
      days_of_week: selectedDays,
      time_slot: timeSlot,
      end_condition: endCondition,
      end_count: endCondition === "AfterCount" ? endCount : undefined,
      campaign,
      hashtags
    });
    
    await fetchSchedules();
    setModalOpen(false);
    
    // Reset
    setTitle("");
    setContent("");
    setContentType("Text");
    setSelectedPlatforms(["X", "LinkedIn"]);
    setFrequency("Weekly");
    setSelectedDays(["Mon", "Wed"]);
    setTimeSlot("09:00");
  };

  const handleToggle = async (id: string) => {
    await apiToggleRecurringSchedule(Number(id));
    await fetchSchedules();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this recurring schedule?")) {
      await apiDeleteRecurringSchedule(Number(id));
      await fetchSchedules();
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto custom-scrollbar">
      {/* Action Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-violet-900/40 via-indigo-900/30 to-purple-900/40 border border-violet-500/20 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-2">
          <span className="p-2.5 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400">
            <Repeat size={20} />
          </span>
          <span className="text-xs font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1">
            {recurringSchedules.length} Active Recurrence Schedules
          </span>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-900/40 transition-all cursor-pointer"
          >
            <Plus size={16} /> New Recurring Rule
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
            <Repeat size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Active Rules</p>
            <p className="text-2xl font-black text-white mt-0.5">
              {recurringSchedules.filter((s) => s.active).length} / {recurringSchedules.length}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Auto Published</p>
            <p className="text-2xl font-black text-white mt-0.5">
              {recurringSchedules.reduce((acc, curr) => acc + curr.publishedCount, 0)} Posts
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Next Auto Queue</p>
            <p className="text-2xl font-black text-white mt-0.5">Today at 09:00 AM</p>
          </div>
        </div>
      </div>

      {/* Active Recurring Schedules List */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
          <span>Active Recurrence Schedules</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 font-bold">
            {recurringSchedules.length}
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recurringSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`p-6 rounded-2xl border transition-all shadow-xl space-y-4 relative ${
                schedule.active
                  ? "bg-white/5 border-white/10 hover:border-violet-500/40"
                  : "bg-white/[0.02] border-white/5 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">{schedule.title}</h3>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        schedule.active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-white/5 text-white/40 border-white/10"
                      }`}
                    >
                      {schedule.active ? "ACTIVE" : "PAUSED"}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-1">
                    Frequency: <span className="text-violet-300 font-semibold">{schedule.frequency}</span> on{" "}
                    {schedule.daysOfWeek.join(", ")} at {schedule.timeSlot}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleRecurringSchedule(schedule.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    schedule.active
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                  }`}
                  title={schedule.active ? "Pause Recurrence" : "Activate Recurrence"}
                >
                  {schedule.active ? <Pause size={16} /> : <Play size={16} />}
                </button>
              </div>

              {/* Template Copy preview */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-white/80 line-clamp-3 leading-relaxed">
                "{schedule.content}"
              </div>

              {/* Connected Platforms */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5">
                  {schedule.platforms.map((p) => {
                    const match = availablePlatforms.find((item) => item.key === p);
                    const Icon = match?.icon || Globe;
                    return (
                      <span
                        key={p}
                        className={`w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs ${match?.color}`}
                        title={p}
                      >
                        <Icon />
                      </span>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 text-xs text-white/40">
                  <span>Published: <strong className="text-white">{schedule.publishedCount}</strong> times</span>
                  <button
                    type="button"
                    onClick={() => deleteRecurringSchedule(schedule.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-white/30 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Recurring Rule Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0d0920] rounded-2xl border border-white/10 p-6 space-y-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-violet-400">
                <Repeat size={20} />
                <h3 className="text-lg font-black text-white">Configure Recurring Rule</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-white/40 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">Rule Title</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Product Spotlight, Daily Motivation Tweet"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">Post Content Template</label>
                <textarea
                  rows={3}
                  placeholder="Write your template copy... (Supports hashtags and platform tagging)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-white/30 resize-none"
                />
              </div>

              {/* Frequency & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5">Recurrence Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d0920] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-weekly">Bi-weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5">Preferred Time Slot</label>
                  <input
                    type="time"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Days of Week */}
              <div>
                <label className="block text-xs font-bold text-white/70 mb-2">Repeat On Days</label>
                <div className="flex flex-wrap gap-2">
                  {daysList.map((day) => {
                    const active = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          active
                            ? "bg-violet-600 text-white shadow-md shadow-violet-900/40"
                            : "bg-white/5 border border-white/10 text-white/50 hover:text-white"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Platforms */}
              <div>
                <label className="block text-xs font-bold text-white/70 mb-2">Target Platforms</label>
                <div className="grid grid-cols-3 gap-2">
                  {availablePlatforms.map(({ key, label, icon: Icon, color }) => {
                    const active = selectedPlatforms.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => togglePlatform(key)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          active
                            ? "bg-violet-600/20 border-violet-500/50 text-white"
                            : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                        }`}
                      >
                        <Icon className={color} />
                        <span>{key}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-semibold text-sm border border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSchedule}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-900/40"
              >
                Save Recurrence Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
