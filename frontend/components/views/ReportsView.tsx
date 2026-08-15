"use client";

import { useState, useMemo } from "react";
import {
  FileText, Download, Calendar, TrendingUp,
  BarChart2, ArrowUpRight, ArrowDownRight, Eye,
  RefreshCw, Sparkles, DollarSign, Percent, ArrowRight,
  TrendingDown, Info, HelpCircle
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, CartesianGrid, Cell, AreaChart, Area
} from "recharts";

const MONTHLY_DATA = [
  { month: "Jan", posts: 42, reach: "82K",  engagement: "5.4%", revenue: "$3.2K" },
  { month: "Feb", posts: 38, reach: "71K",  engagement: "4.9%", revenue: "$2.8K" },
  { month: "Mar", posts: 55, reach: "105K", engagement: "7.1%", revenue: "$4.5K" },
  { month: "Apr", posts: 61, reach: "128K", engagement: "8.3%", revenue: "$5.1K" },
  { month: "May", posts: 47, reach: "94K",  engagement: "6.5%", revenue: "$3.9K" },
  { month: "Jun", posts: 73, reach: "152K", engagement: "9.8%", revenue: "$6.4K" },
  { month: "Jul", posts: 48, reach: "110K", engagement: "7.6%", revenue: "$4.8K" },
];

const TOP_POSTS = [
  { title: "Summer Sale Campaign",      platform: "Instagram", reach: "42K", eng: "11.2%", trend: "up"   },
  { title: "New Product Launch",        platform: "Facebook",  reach: "36K", eng: "8.7%",  trend: "up"   },
  { title: "AI Marketing Tips Thread",  platform: "LinkedIn",  reach: "29K", eng: "6.3%",  trend: "down" },
  { title: "Behind the Scenes Reel",    platform: "Instagram", reach: "54K", eng: "13.1%", trend: "up"   },
  { title: "Customer Success Story",    platform: "Twitter",   reach: "18K", eng: "4.5%",  trend: "down" },
];

const CAMPAIGN_ROI_DATA = [
  { name: "Summer Sale Campaign",      budget: 3500, revenue: 15400, reach: "120K", eng: "11.2%", roi: 340 },
  { name: "New Product Launch",        budget: 5000, revenue: 21000, reach: "95K",  eng: "8.7%",  roi: 320 },
  { name: "AI Marketing Tips Thread",  budget: 1500, revenue: 4200,  reach: "78K",  eng: "6.3%",  roi: 180 },
  { name: "Behind the Scenes Reel",    budget: 800,  revenue: 3800,  reach: "145K", eng: "13.1%", roi: 375 },
  { name: "Customer Success Story",    budget: 1200, revenue: 3100,  reach: "44K",  eng: "4.5%",  roi: 158 },
];

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "text-[#e4405f]",
  Facebook:  "text-[#1877f2]",
  LinkedIn:  "text-[#0077b5]",
  Twitter:   "text-white",
  Pinterest: "text-[#bd081c]",
};

export default function ReportsView() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [activeTab, setActiveTab] = useState<"performance" | "roi">("performance");
  
  // Projection Simulator State
  const [simBudget, setSimBudget] = useState(2500);

  const totals = {
    posts:      317,
    reach:      "742K",
    engagement: "7.2%",
    growth:     "+24%",
  };

  // ROI Totals
  const roiTotals = useMemo(() => {
    const totalBudget = CAMPAIGN_ROI_DATA.reduce((sum, item) => sum + item.budget, 0);
    const totalRevenue = CAMPAIGN_ROI_DATA.reduce((sum, item) => sum + item.revenue, 0);
    const netProfit = totalRevenue - totalBudget;
    const overallRoi = ((totalRevenue - totalBudget) / totalBudget) * 100;
    return {
      budget: `$${(totalBudget / 1000).toFixed(1)}K`,
      revenue: `$${(totalRevenue / 1000).toFixed(1)}K`,
      profit: `$${(netProfit / 1000).toFixed(1)}K`,
      roi: `+${overallRoi.toFixed(1)}%`
    };
  }, []);

  // Simulator calculation
  const simProjections = useMemo(() => {
    // Basic scaling rules for simulation:
    // $1 budget yields ~25 reach, 1.8 comments/likes, and ~3.5x revenue ROI
    const projectedReach = simBudget * 25;
    const projectedEng = 7.8; // avg engagement percent
    const projectedRevenue = simBudget * 3.4;
    const projectedProfit = projectedRevenue - simBudget;
    const projectedRoi = ((projectedRevenue - simBudget) / simBudget) * 100;

    return {
      reach: projectedReach >= 1000 ? `${(projectedReach / 1000).toFixed(0)}K` : projectedReach,
      eng: `${projectedEng}%`,
      revenue: `$${projectedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      roi: `+${projectedRoi.toFixed(0)}%`,
      profit: `$${projectedProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    };
  }, [simBudget]);

  const handleExportCSV = () => {
    const headers = "Campaign,Budget,Revenue,Reach,Engagement,ROI%\n";
    const rows = CAMPAIGN_ROI_DATA.map(
      (c) => `"${c.name}",${c.budget},${c.revenue},"${c.reach}","${c.eng}",${c.roi}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SocialPilot_ROI_Report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1440px] mx-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-violet-900/40 border border-violet-500/20 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-0.5">
              Reports Dashboard
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Performance & Analytics Reports</h1>
          <p className="text-sm text-white/40 mt-1">Generate comprehensive ROI sheets, track performance logs, and view campaign projections.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
            {(["7d", "30d", "90d", "1y"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  period === p
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("performance")}
          className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "performance"
              ? "border-violet-500 text-white"
              : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          <BarChart2 size={16} /> Performance Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("roi")}
          className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "roi"
              ? "border-violet-500 text-white"
              : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          <TrendingUp size={16} className="text-emerald-400" /> ROI & Campaign Comparisons
        </button>
      </div>

      {/* Tab Content 1: Performance Overview */}
      {activeTab === "performance" && (
        <div className="space-y-8 animate-fade-in">
          {/* KPI Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Posts",      value: totals.posts,      icon: BarChart2,   color: "text-violet-400", gradient: "from-violet-500/10 to-purple-500/5", border: "border-violet-500/25" },
              { label: "Total Reach",      value: totals.reach,      icon: Eye,         color: "text-blue-400",   gradient: "from-blue-500/10 to-indigo-500/5",   border: "border-blue-500/25" },
              { label: "Avg Engagement",   value: totals.engagement, icon: TrendingUp,  color: "text-emerald-400",gradient: "from-emerald-500/10 to-teal-500/5",  border: "border-emerald-500/25" },
              { label: "Audience Growth",  value: totals.growth,     icon: ArrowUpRight,color: "text-amber-400",  gradient: "from-amber-500/10 to-orange-500/5", border: "border-amber-500/25" },
            ].map(({ label, value, icon: Icon, color, gradient, border }) => (
              <div key={label} className={`dash-card p-6 border ${border} bg-gradient-to-br ${gradient}`}>
                <div className={`w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className={`text-3xl font-black ${color} tracking-tight`}>{value}</p>
                <p className="text-xs text-white/40 mt-1 font-semibold">{label}</p>
                <div className="flex items-center gap-1 mt-2.5">
                  <ArrowUpRight size={11} className="text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-semibold">vs last period</span>
                </div>
              </div>
            ))}
          </div>

          {/* Monthly Performance Table */}
          <div className="dash-card overflow-hidden border border-white/10">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-violet-400" />
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Monthly Performance</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/40 font-semibold">
                <Calendar size={12} />
                Jan – Jul 2026
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    {["Month", "Posts Published", "Total Reach", "Avg Engagement", "Est. Revenue"].map((h) => (
                      <th key={h} className="text-left text-[11px] font-black text-white/30 uppercase tracking-wider px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {MONTHLY_DATA.map((row, i) => (
                    <tr key={row.month} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                            <Calendar size={12} className="text-violet-400" />
                          </div>
                          <span className="text-sm font-semibold text-white">{row.month}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm font-bold text-white">{row.posts}</td>
                      <td className="px-6 py-3.5 text-sm text-white/70">{row.reach}</td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-bold text-emerald-400">{row.engagement}</span>
                      </td>
                      <td className="px-6 py-3.5 text-sm font-bold text-violet-400">{row.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Performing Posts */}
          <div className="dash-card p-6 border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={15} className="text-emerald-400" /> Top Performing Posts
              </h2>
            </div>
            <div className="space-y-3">
              {TOP_POSTS.map((post, i) => (
                <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/20 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xs font-black text-violet-400 shrink-0">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{post.title}</p>
                    <span className={`text-[10px] font-bold ${PLATFORM_COLORS[post.platform] ?? "text-white/50"}`}>{post.platform}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">{post.reach}</p>
                    <p className="text-[10px] text-white/40 font-semibold">reach</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {post.trend === "up"
                      ? <ArrowUpRight size={14} className="text-emerald-400" />
                      : <ArrowDownRight size={14} className="text-red-400" />
                    }
                    <span className={`text-sm font-bold ${post.trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
                      {post.eng}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: ROI & Campaign Comparison Dashboard */}
      {activeTab === "roi" && (
        <div className="space-y-8 animate-fade-in">
          {/* ROI KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Campaign Spend",   value: roiTotals.budget,  icon: DollarSign, color: "text-blue-400",    border: "border-blue-500/20" },
              { label: "Est. Revenue",     value: roiTotals.revenue, icon: DollarSign, color: "text-emerald-400", border: "border-emerald-500/20" },
              { label: "Net Campaign Profit", value: roiTotals.profit,  icon: DollarSign, color: "text-violet-400",  border: "border-violet-500/20" },
              { label: "Overall ROI %",    value: roiTotals.roi,     icon: Percent,    color: "text-amber-400",   border: "border-amber-500/20" },
            ].map(({ label, value, icon: Icon, color, border }) => (
              <div key={label} className={`dash-card p-6 border ${border} bg-white/5`}>
                <div className={`w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className={`text-3xl font-black ${color} tracking-tight`}>{value}</p>
                <p className="text-xs text-white/40 mt-1 font-semibold">{label}</p>
              </div>
            ))}
          </div>

          {/* Recharts Bar Chart: Budget vs Revenue */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 dash-card p-6 border border-white/10">
              <h2 className="text-sm font-black text-white uppercase tracking-wider mb-1">Campaign ROI comparison</h2>
              <p className="text-xs text-white/40 mb-6 font-semibold">Side-by-side comparison of budget vs generated revenue</p>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CAMPAIGN_ROI_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      contentStyle={{ backgroundColor: "#0d0920", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "15px" }} />
                    <Bar name="Budget Spent ($)" dataKey="budget" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar name="Revenue Generated ($)" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Campaign ROI Projections Simulator */}
            <div className="col-span-12 lg:col-span-4 dash-card p-6 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={14} className="text-violet-400" />
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">ROI Projection Simulator</h2>
                </div>
                <p className="text-xs text-white/40 mb-5 font-semibold">Simulate ROI models by sliding your planned ad spend</p>
                
                {/* Budget Slider */}
                <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5 mb-6">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-white/60">Planned Budget:</span>
                    <span className="text-violet-400 text-sm">${simBudget.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="250"
                    value={simBudget}
                    onChange={(e) => setSimBudget(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-600 focus:outline-none"
                  />
                  <div className="flex justify-between text-[9px] text-white/30 font-black">
                    <span>$500</span>
                    <span>$10,000</span>
                  </div>
                </div>

                {/* Simulated Outputs */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs border-b border-white/5 pb-2 font-medium">
                    <span className="text-white/50">Projected Reach</span>
                    <span className="text-white font-bold">{simProjections.reach}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-white/5 pb-2 font-medium">
                    <span className="text-white/50">Projected Engagement</span>
                    <span className="text-white font-bold">{simProjections.eng}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-white/5 pb-2 font-medium">
                    <span className="text-white/50">Projected Revenue</span>
                    <span className="text-emerald-400 font-bold">{simProjections.revenue}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-white/5 pb-2 font-medium">
                    <span className="text-white/50">Projected Net Profit</span>
                    <span className="text-violet-400 font-bold">{simProjections.profit}</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/25 p-3.5 rounded-xl flex items-center justify-between mt-6">
                <div>
                  <p className="text-[10px] text-emerald-400/70 font-black uppercase tracking-wider">Estimated ROI</p>
                  <p className="text-2xl font-black text-emerald-400 mt-0.5">{simProjections.roi}</p>
                </div>
                <ArrowRight size={18} className="text-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Detailed Campaign ROI comparison Table */}
          <div className="dash-card overflow-hidden border border-white/10">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Detailed Campaign ROI Metrics</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-[11px] font-black text-white/30 uppercase tracking-wider">
                    {["Campaign Name", "Spend", "Est. Revenue", "Reach", "Avg Eng.", "ROI %", "Status"].map((h) => (
                      <th key={h} className="px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {CAMPAIGN_ROI_DATA.map((row) => (
                    <tr key={row.name} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-bold text-white">{row.name}</td>
                      <td className="px-6 py-4 text-white/70">${row.budget.toLocaleString()}</td>
                      <td className="px-6 py-4 text-white/70">${row.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-white/70">{row.reach}</td>
                      <td className="px-6 py-4 text-emerald-400 font-semibold">{row.eng}</td>
                      <td className="px-6 py-4">
                        <span className="text-violet-400 font-bold">+{row.roi}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          Complete
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
