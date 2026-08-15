"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, CartesianGrid, Area, AreaChart,
} from "recharts";
import { TrendingUp, BarChart3, Calendar, Users, Clock, ArrowUpRight, Sparkles } from "lucide-react";
import { FaTwitter, FaInstagram, FaFacebook, FaLinkedin } from "react-icons/fa";
import { StatCard } from "@/components/ui/Card";

const engagementData = [
  { name: "Jan", engagement: 2200 },
  { name: "Feb", engagement: 3100 },
  { name: "Mar", engagement: 2800 },
  { name: "Apr", engagement: 4200 },
  { name: "May", engagement: 3800 },
  { name: "Jun", engagement: 5600 },
];

const followerDistribution = [
  { name: "Instagram",   value: 4500, color: "#e4405f", pct: "45%" },
  { name: "Facebook",    value: 3000, color: "#1877f2", pct: "30%" },
  { name: "LinkedIn",    value: 1800, color: "#0077b5", pct: "18%" },
  { name: "X (Twitter)", value: 700,  color: "#ffffff", pct: "7%"  },
];

const platformPerformance = [
  { platform: "Instagram",   pct: "45%", desc: "Best Performing",      color: "text-[#e4405f]", bg: "bg-[#e4405f]/15" },
  { platform: "Facebook",    pct: "30%", desc: "Good Reach",           color: "text-[#1877f2]", bg: "bg-[#1877f2]/15" },
  { platform: "LinkedIn",    pct: "18%", desc: "Professional Audience",color: "text-[#0077b5]", bg: "bg-[#0077b5]/15" },
  { platform: "X (Twitter)", pct: "7%",  desc: "Needs Improvement",    color: "text-white/60",  bg: "bg-white/10"     },
];

const recentActivity = [
  { platform: "Instagram",   date: "06 Jul", likes: 120, comments: 45, shares: 20, icon: FaInstagram, color: "text-[#e4405f]" },
  { platform: "Facebook",    date: "05 Jul", likes: 95,  comments: 38, shares: 15, icon: FaFacebook,  color: "text-[#1877f2]" },
  { platform: "LinkedIn",    date: "04 Jul", likes: 70,  comments: 25, shares: 12, icon: FaLinkedin,  color: "text-[#0077b5]" },
  { platform: "X (Twitter)", date: "03 Jul", likes: 110, comments: 50, shares: 22, icon: FaTwitter,   color: "text-white"     },
];

const topPosts = [
  { post: "Summer Sale Campaign",  platform: "Instagram", likes: 420, comments: 88, shares: 35, icon: FaInstagram, color: "text-[#e4405f]" },
  { post: "New Product Launch",    platform: "Facebook",  likes: 360, comments: 74, shares: 28, icon: FaFacebook,  color: "text-[#1877f2]" },
  { post: "AI Marketing Tips",     platform: "LinkedIn",  likes: 295, comments: 52, shares: 19, icon: FaLinkedin,  color: "text-[#0077b5]" },
];

export default function AnalyticsView() {
  return (
    <div className="p-6 lg:p-10 space-y-8 lg:space-y-10 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <span className="text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-2.5 py-0.5">
          Live Insights Active
        </span>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-12" style={{ gap: "24px" }}>
        <div className="col-span-6 lg:col-span-3">
          <StatCard label="Total Posts"  value="120"  trend="12%" positive={true} icon={<BarChart3 size={18} />} delay={0}   />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <StatCard label="Followers"    value="8.2K" trend="8%"  positive={true} icon={<Users    size={18} />} delay={70}  />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <StatCard label="Engagement"   value="75%"  trend="5%"  positive={true} icon={<TrendingUp size={18} />} delay={140} />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <StatCard label="Reach"        value="18K"  trend="15%" positive={true} icon={<Clock   size={18} />} delay={210} />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-12" style={{ gap: "24px" }}>
        {/* Area Chart */}
        <div className="col-span-12 lg:col-span-9 dash-card p-6">
          <h2 className="text-[15px] font-bold text-white mb-1">Engagement Overview</h2>
          <p className="text-xs text-white/40 mb-5">Monthly breakdown of profile interactions</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gEngA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                <Tooltip
                  cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1.5 }}
                  contentStyle={{ backgroundColor: "#0d0920", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="engagement" stroke="#8b5cf6" strokeWidth={3} fill="url(#gEngA)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="col-span-12 lg:col-span-3 dash-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-white mb-1">Followers Distribution</h2>
            <p className="text-xs text-white/40 mb-4">Followers split by active platforms</p>
          </div>
          <div className="flex flex-col items-center gap-5 w-full">
            <div className="w-40 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={followerDistribution} dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={3}>
                    {followerDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0d0920", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", fontSize: "11px", color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-2">
              {followerDistribution.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-xs border-b border-white/5" style={{ paddingBottom: "6px" }}>
                  <span className="flex items-center text-white/60" style={{ gap: "6px" }}>
                    <span className="rounded-full" style={{ width: "10px", height: "10px", backgroundColor: entry.color, flexShrink: 0 }} />
                    {entry.name}
                  </span>
                  <span className="font-bold text-white" style={{ marginLeft: "12px" }}>{entry.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Insight Chips */}
      <div className="grid grid-cols-12" style={{ gap: "24px" }}>
        {[
          { label: "Top Platform",    val: "Instagram", desc: "Best engagement rate",    color: "text-[#e4405f]" },
          { label: "Best Posting Day",val: "Friday",    desc: "18:00 - 21:00 UTC",       color: "text-violet-400" },
          { label: "Impressions",     val: "42.5K",     desc: "+14.2% from last month",  color: "text-emerald-400" },
          { label: "Average Reach",   val: "6.5K",      desc: "Per published post",      color: "text-blue-400" },
        ].map((item, idx) => (
          <div key={idx} className="col-span-12 sm:col-span-6 lg:col-span-3 dash-card p-5">
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider">{item.label}</p>
            <p className={`text-2xl font-black mt-2 tracking-tight ${item.color}`}>{item.val}</p>
            <p className="text-xs text-white/30 mt-1 font-medium">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="dash-card p-6 overflow-x-auto">
        <h2 className="text-[15px] font-bold text-white mb-4">Recent Activity Logs</h2>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/40 font-semibold">
              {["Platform","Date","Likes","Comments","Shares"].map(h => <th key={h} className="pb-3 pr-4">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-white/80 font-medium">
            {recentActivity.map((row, idx) => {
              const Icon = row.icon;
              return (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 flex items-center gap-2"><Icon className={row.color} /><span>{row.platform}</span></td>
                  <td>{row.date}</td>
                  <td className="text-violet-400">{row.likes}</td>
                  <td>{row.comments}</td>
                  <td>{row.shares}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Top Posts */}
      <div className="dash-card p-6 overflow-x-auto">
        <h2 className="text-[15px] font-bold text-white mb-4">Top Performing Posts</h2>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/40 font-semibold">
              {["Post Campaign","Platform","Likes","Comments","Shares"].map(h => <th key={h} className="pb-3 pr-4">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-white/80 font-medium">
            {topPosts.map((row, idx) => {
              const Icon = row.icon;
              return (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 font-bold text-white">{row.post}</td>
                  <td className="flex items-center gap-2 py-3.5"><Icon className={row.color} /><span>{row.platform}</span></td>
                  <td className="text-violet-400">{row.likes}</td>
                  <td>{row.comments}</td>
                  <td>{row.shares}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Platform Performance Cards */}
      <div className="grid grid-cols-12" style={{ gap: "24px" }}>
        {platformPerformance.map((item, idx) => (
          <div key={idx} className="col-span-6 lg:col-span-3 dash-card p-5 flex flex-col justify-between h-32">
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">{item.platform}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className={`text-3xl font-black ${item.color} tracking-tight`}>{item.pct}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border border-white/10 ${item.bg} ${item.color}`}>{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
