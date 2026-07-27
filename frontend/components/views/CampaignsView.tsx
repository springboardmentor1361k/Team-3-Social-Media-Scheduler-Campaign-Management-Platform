"use client";

import { useState, useEffect } from "react";
import {
  Target, Plus, Calendar, Users, TrendingUp,
  BarChart2, Clock, CheckCircle2, AlertCircle, PlayCircle,
  MoreHorizontal, Eye,
} from "lucide-react";
import { apiListCampaigns } from "@/lib/api";

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

  useEffect(() => {
    async function load() {
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
    }
    load();
  }, []);

  const filtered = filter === "All" ? campaigns : campaigns.filter(c => c.status === filter);

  const statCounts = {
    active:    campaigns.filter(c => c.status === "Active").length,
    completed: campaigns.filter(c => c.status === "Completed").length,
    draft:     campaigns.filter(c => c.status === "Draft").length,
    paused:    campaigns.filter(c => c.status === "Paused").length,
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1440px] mx-auto">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-2.5 py-0.5">
            Campaigns
          </span>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-900/30">
          <Plus size={15} /> New Campaign
        </button>
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
            className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${
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
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                    <Eye size={12} /> View
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
