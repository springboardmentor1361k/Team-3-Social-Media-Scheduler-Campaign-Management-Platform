"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Target, Plus, Calendar, Users, TrendingUp,
  BarChart2, Clock, CheckCircle2, AlertCircle, PlayCircle,
  MoreHorizontal, Eye, FileText, X
} from "lucide-react";
import { apiListCampaigns, apiCreateCampaign } from "@/lib/api";

type CampaignStatus = "Active" | "Completed" | "Draft" | "Paused";

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  platform: string;
  budget: string;
  reach: string;
  engagement: string;
  startDate: string;
  endDate: string;
  progress: number;
  color: string;
}

const statusConfig: Record<CampaignStatus, { icon: React.ElementType; class: string; bg: string; label: string }> = {
  "Active":    { icon: PlayCircle,   class: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/25", label: "Active"    },
  "Completed": { icon: CheckCircle2, class: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/25",       label: "Completed" },
  "Draft":     { icon: Clock,        class: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/25",     label: "Draft"     },
  "Paused":    { icon: AlertCircle,  class: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/25",   label: "Paused"    },
};

export default function CampaignsView() {
  const [filter, setFilter] = useState<CampaignStatus | "All">("All");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // New Campaign Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPlatforms, setNewPlatforms] = useState("Instagram, Facebook");
  const [newBudget, setNewBudget] = useState("$1,500");
  const [newStatus, setNewStatus] = useState<CampaignStatus>("Active");
  const [newObjective, setNewObjective] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");

  const loadCampaigns = async () => {
    try {
      const data = await apiListCampaigns();
      setCampaigns(data.map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        status: c.status as CampaignStatus,
        platform: c.platforms || "All Platforms",
        budget: c.budget || "$0",
        reach: c.reach || "0",
        engagement: c.engagement || "0%",
        startDate: c.start_date ? new Date(c.start_date).toLocaleDateString() : "-",
        endDate: c.end_date ? new Date(c.end_date).toLocaleDateString() : "-",
        progress: c.progress || 0,
        color: c.color || "from-violet-500 to-purple-600",
      })));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      await apiCreateCampaign({
        name: newName,
        status: newStatus,
        platforms: newPlatforms,
        budget: newBudget,
        objective: newObjective || undefined,
        start_date: newStartDate || null,
        end_date: newEndDate || null,
      });
      setModalOpen(false);
      setNewName("");
      setNewObjective("");
      setNewStartDate("");
      setNewEndDate("");
      await loadCampaigns();
    } catch (err) {
      console.error("Failed to create campaign:", err);
    }
  };

  const filtered = filter === "All" ? campaigns : campaigns.filter(c => c.status === filter);

  const statCounts = {
    active:    campaigns.filter(c => c.status === "Active").length,
    completed: campaigns.filter(c => c.status === "Completed").length,
    draft:     campaigns.filter(c => c.status === "Draft").length,
    paused:    campaigns.filter(c => c.status === "Paused").length,
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1440px] mx-auto custom-scrollbar">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-2.5 py-0.5">
            Campaign Management
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/reports?category=campaigns"
            className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-bold rounded-xl transition-all"
          >
            <FileText size={14} className="text-violet-400" /> View Campaign Reports
          </Link>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-900/30 cursor-pointer"
          >
            <Plus size={14} /> New Campaign
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: "24px" }}>
        {[
          { label: "Active",    value: statCounts.active,    icon: PlayCircle,   color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Completed", value: statCounts.completed, icon: CheckCircle2, color: "text-blue-400",    bg: "bg-blue-500/10"    },
          { label: "Draft",     value: statCounts.draft,     icon: Clock,        color: "text-amber-400",   bg: "bg-amber-500/10"   },
          { label: "Paused",    value: statCounts.paused,    icon: AlertCircle,  color: "text-orange-400",  bg: "bg-orange-500/10"  },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="dash-card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-white/40 mt-0.5">{label} Campaigns</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["All", "Active", "Completed", "Draft", "Paused"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
              filter === s
                ? "bg-violet-600 border-violet-500 text-white"
                : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            {s} {s !== "All" && `(${statCounts[s.toLowerCase() as keyof typeof statCounts] ?? 0})`}
          </button>
        ))}
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" style={{ gap: "24px" }}>
        {filtered.map((campaign) => {
          const StatusIcon = statusConfig[campaign.status].icon;
          return (
            <div key={campaign.id} className="dash-card overflow-hidden flex flex-col">
              <div className={`h-1.5 bg-gradient-to-r ${campaign.color}`} />
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-black text-white truncate">{campaign.name}</h3>
                    <p className="text-xs text-white/40 mt-0.5">{campaign.platform}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border ${statusConfig[campaign.status].bg} ${statusConfig[campaign.status].class}`}>
                      <StatusIcon size={10} />
                      {campaign.status}
                    </span>
                    <button className="p-1 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                      <MoreHorizontal size={13} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Budget",     value: campaign.budget,     icon: BarChart2   },
                    { label: "Reach",      value: campaign.reach,      icon: Users       },
                    { label: "Engagement", value: campaign.engagement, icon: TrendingUp  },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="p-3 bg-white/[0.03] rounded-xl">
                      <Icon size={11} className="text-white/30 mb-1" />
                      <p className="text-sm font-black text-white">{value}</p>
                      <p className="text-[9px] text-white/30 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Progress Bar */}
                {campaign.status !== "Draft" && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-white/40">Campaign Progress</span>
                      <span className="text-[10px] font-bold text-white/60">{campaign.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${campaign.color} rounded-full transition-all`}
                        style={{ width: `${campaign.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <Calendar size={11} />
                    {campaign.startDate} – {campaign.endDate}
                  </div>
                  <Link
                    href={`/reports?category=campaigns`}
                    className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    <Eye size={12} /> View Report
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Campaign Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-[#0d0920] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in cursor-default space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-violet-400 font-bold text-sm">
                <Target className="w-5 h-5" />
                <span>Create New Campaign</span>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-white/50 mb-1.5 block">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Brand Launch 2026"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="font-bold text-white/50 mb-1.5 block">Target Social Platforms</label>
                <input
                  type="text"
                  placeholder="e.g. Instagram, LinkedIn, X"
                  value={newPlatforms}
                  onChange={(e) => setNewPlatforms(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="font-bold text-white/50 mb-1.5 block">Budget Allocation</label>
                <input
                  type="text"
                  placeholder="e.g. $2,500"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="font-bold text-white/50 mb-1.5 block">Campaign Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as CampaignStatus)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                >
                  <option value="Active" className="bg-[#0d0920]">Active</option>
                  <option value="Draft" className="bg-[#0d0920]">Draft</option>
                  <option value="Paused" className="bg-[#0d0920]">Paused</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-white/50 mb-1.5 block">Objective / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Drive 500 leads for summer product line"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-white/50 mb-1.5 block">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="font-bold text-white/50 mb-1.5 block">End Date</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 font-bold text-white/60 hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold hover:from-violet-500 hover:to-indigo-500 transition-all shadow-md cursor-pointer"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
