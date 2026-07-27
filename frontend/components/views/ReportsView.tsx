"use client";

import { useState, useEffect } from "react";
import {
  FileText, Download, Calendar, TrendingUp,
  BarChart2, ArrowUpRight, ArrowDownRight, Eye,
  RefreshCw, Sparkles,
} from "lucide-react";
import { apiListReports } from "@/lib/api";

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "text-[#e4405f]",
  Facebook:  "text-[#1877f2]",
  LinkedIn:  "text-[#0077b5]",
  Twitter:   "text-white",
  Pinterest: "text-[#bd081c]",
};

export default function ReportsView() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await apiListReports();
        setData(result);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  if (!data) return <div className="p-10 text-white">Loading reports...</div>;

  const { monthly_data: MONTHLY_DATA, top_posts: TOP_POSTS, totals } = data;

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1440px] mx-auto">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-0.5">
            Reports
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
            {(["7d", "30d", "90d", "1y"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  period === p
                    ? "bg-violet-600 text-white"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white/70 hover:text-white text-sm font-semibold rounded-xl transition-all">
            <Download size={14} /> Export PDF
          </button>
          <button className="p-2.5 bg-white/5 border border-white/10 text-white/50 hover:text-white rounded-xl transition-all">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {[
          { label: "Total Posts",      value: totals.posts,      suffix: "",    icon: BarChart2,   color: "text-violet-400", gradient: "from-violet-500 to-purple-600" },
          { label: "Total Reach",      value: totals.reach,      suffix: "",    icon: Eye,         color: "text-blue-400",   gradient: "from-blue-500 to-indigo-600"   },
          { label: "Avg Engagement",   value: totals.engagement, suffix: "",    icon: TrendingUp,  color: "text-emerald-400",gradient: "from-emerald-500 to-teal-600"  },
          { label: "Audience Growth",  value: totals.growth,     suffix: "",    icon: ArrowUpRight,color: "text-amber-400",  gradient: "from-amber-500 to-orange-600" },
        ].map(({ label, value, icon: Icon, color, gradient }) => (
          <div key={label} className="dash-card p-5">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 opacity-80`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-white/40 mt-1">{label}</p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight size={11} className="text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-semibold">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Performance Table */}
      <div className="dash-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-violet-400" />
            <h2 className="text-[15px] font-black text-white">Monthly Performance</h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Calendar size={12} />
            Jan – Jul 2024
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {["Month", "Posts Published", "Total Reach", "Avg Engagement", "Est. Revenue"].map((h) => (
                  <th key={h} className="text-left text-[11px] font-black text-white/30 uppercase tracking-wider px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTHLY_DATA.map((row, i) => (
                <tr key={row.month} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${i === MONTHLY_DATA.length - 1 ? "border-b-0" : ""}`}>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
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
                  <td className="px-6 py-3.5 text-sm font-semibold text-violet-400">{row.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performing Posts */}
      <div className="dash-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-black text-white flex items-center gap-2">
            <TrendingUp size={15} className="text-emerald-400" /> Top Performing Posts
          </h2>
          <button className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors">
            View all →
          </button>
        </div>
        <div className="space-y-3">
          {TOP_POSTS.map((post, i) => (
            <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-white/[0.03] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xs font-black text-violet-400 shrink-0">
                #{i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{post.title}</p>
                <span className={`text-xs font-semibold ${PLATFORM_COLORS[post.platform] ?? "text-white/50"}`}>{post.platform}</span>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-white">{post.reach}</p>
                <p className="text-xs text-white/40">reach</p>
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
  );
}
