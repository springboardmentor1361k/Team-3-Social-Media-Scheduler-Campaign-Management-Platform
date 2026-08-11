"use client";

import { useState, useEffect } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Wifi, Clock, CheckCircle2, Megaphone,
  Activity, Users, Calendar, AlertCircle,
  ArrowRight, TrendingUp, Plus, ArrowUpRight, Flame,
} from "lucide-react";
import { FaLinkedin, FaTwitter, FaFacebook, FaInstagram, FaYoutube, FaPinterest } from "react-icons/fa";
import { StatCard } from "@/components/ui/Card";
import {
  mockDashboardStats,
  mockChartData,
  mockScheduledPosts,
  mockNotifications,
} from "@/lib/mockData";
import { apiListAccounts, SocialAccountOut } from "@/lib/api";
import Link from "next/link";

const iconMap: Record<string, React.ElementType> = {
  "wifi": Wifi,
  "clock": Clock,
  "check-circle": CheckCircle2,
  "megaphone": Megaphone,
  "activity": Activity,
  "users": Users,
  "calendar": Calendar,
  "alert-circle": AlertCircle,
};

const platformColors: Record<string, string> = {
  facebook:  "#1877f2",
  instagram: "#e4405f",
  linkedin:  "#0077b5",
  twitter:   "#ffffff",
  youtube:   "#ff0000",
  pinterest: "#bd081c",
};

const platformIcons: Record<string, React.ElementType> = {
  facebook:  FaFacebook,
  instagram: FaInstagram,
  linkedin:  FaLinkedin,
  twitter:   FaTwitter,
  youtube:   FaYoutube,
  pinterest: FaPinterest,
};

const quickActions = [
  { label: "New Post", href: "/create", icon: Plus, gradient: "from-violet-600 to-indigo-600", shadow: "rgba(124,58,237,0.35)" },
  { label: "Calendar", href: "/calendar", icon: Calendar, gradient: "from-blue-500   to-cyan-400", shadow: "rgba(59,130,246,0.35)" },
  { label: "Analytics", href: "/analytics", icon: TrendingUp, gradient: "from-emerald-500 to-teal-400", shadow: "rgba(16,185,129,0.35)" },
];

const notifTypeStyles: Record<string, { bg: string; text: string; emoji: string }> = {
  success: { bg: "bg-emerald-500/10", text: "text-emerald-400", emoji: "✓" },
  info: { bg: "bg-blue-500/10", text: "text-blue-400", emoji: "i" },
  warning: { bg: "bg-amber-500/10", text: "text-amber-400", emoji: "!" },
  error: { bg: "bg-red-500/10", text: "text-red-400", emoji: "✕" },
};

export default function DashboardView() {
  const [activeTab, setActiveTab] = useState<"scheduled" | "published">("scheduled");
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccountOut[]>([]);

  useEffect(() => {
    apiListAccounts()
      .then(setConnectedAccounts)
      .catch(() => {}); // silently fail — dashboard degrades gracefully
  }, []);

  // Rebuild stats with live connected account count
  const liveStats = mockDashboardStats.map((s) =>
    s.label === "Connected Accounts"
      ? { ...s, value: String(connectedAccounts.filter((a) => a.status === "connected").length) }
      : s
  );

  const filteredPosts = mockScheduledPosts.filter((p) =>
    activeTab === "scheduled" ? p.status === "scheduled" || p.status === "draft" : p.status === "published"
  );

  return (
    <div className="p-6 lg:p-10 space-y-8 lg:space-y-10 max-w-[1440px] mx-auto">

      {/* ── Header strip ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-2.5 py-0.5">
              Performance is up 24% this week
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {quickActions.map(({ label, href, icon: Icon, gradient, shadow }) => (
            <Link
              key={href}
              href={href}
              className={`
                inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl
                text-sm font-bold text-white
                bg-gradient-to-r ${gradient}
                hover:-translate-y-0.5 active:scale-95
                transition-all duration-200
              `}
              style={{ boxShadow: `0 4px 16px ${shadow}` }}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-12" style={{ gap: "24px" }}>
        {liveStats.map((stat, i) => {
          const Icon = iconMap[stat.icon] ?? Activity;
          return (
            <div key={i} className="col-span-6 lg:col-span-3">
              <StatCard
                label={stat.label}
                value={stat.value}
                trend={stat.trend}
                positive={stat.positive}
                icon={<Icon size={18} />}
                delay={i * 70}
              />
            </div>
          );
        })}
      </div>

      {/* ── Chart + Posts ── */}
      <div className="grid grid-cols-12" style={{ gap: "24px" }}>

        {/* Weekly Engagement — Area Chart */}
        <div className="col-span-12 lg:col-span-9 dash-card p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-bold text-white">Weekly Engagement</h2>
              <p className="text-xs text-white/40 mt-0.5">Last 7 days performance</p>
            </div>
            <div className="flex items-center gap-4">
              {[
                { key: "likes", color: "#8b5cf6", label: "Likes" },
                { key: "comments", color: "#6366f1", label: "Comments" },
                { key: "shares", color: "#10b981", label: "Shares" },
              ].map(({ color, label }) => (
                <div key={label} className="hidden sm:flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs text-white/45 font-medium">{label}</span>
                </div>
              ))}
              <Link href="/analytics" className="flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                Full report <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gLikes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gComments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gShares" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="4 4" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(255, 255, 255, 0.4)", fontSize: 12 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ stroke: "rgba(255, 255, 255, 0.1)", strokeWidth: 1.5 }}
                  contentStyle={{
                    borderRadius: "14px",
                    backgroundColor: "#0d0920",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.40)",
                    fontSize: "12px",
                    color: "#fff",
                    fontWeight: 500,
                  }}
                />
                <Area type="monotone" dataKey="likes" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gLikes)" dot={false} />
                <Area type="monotone" dataKey="comments" stroke="#6366f1" strokeWidth={2.5} fill="url(#gComments)" dot={false} />
                <Area type="monotone" dataKey="shares" stroke="#10b981" strokeWidth={2.5} fill="url(#gShares)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Posts */}
        <div className="col-span-12 lg:col-span-3 dash-card flex flex-col">
          <div className="px-5 pt-5 pb-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold text-white">Upcoming Posts</h2>
              <Link
                href="/calendar"
                className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
              >
                View all <ArrowRight size={11} />
              </Link>
            </div>
            <div className="flex gap-1 bg-white/5 rounded-2xl p-1 border border-white/5">
              {(["scheduled", "published"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    flex-1 text-xs font-bold py-1.5 rounded-xl capitalize transition-all
                    ${activeTab === tab
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-white/40 hover:text-white/70"
                    }
                  `}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 max-h-64">
            {filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <CheckCircle2 size={26} className="text-white/20 mb-2" />
                <p className="text-sm text-white/40">No {activeTab} posts yet</p>
              </div>
            ) : (
              filteredPosts.map((post) => {
                const color = platformColors[post.platform.toLowerCase()] ?? "#7c3aed";
                const Icon = platformIcons[post.platform.toLowerCase()] ?? Activity;
                return (
                  <button
                    type="button"
                    key={post.id}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left group leading-normal"
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${color}22`, border: `1px solid ${color}33` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-white/40 mb-0.5 leading-normal">{post.platform} · {post.date}</p>
                      <p className="text-[13px] text-white/80 truncate group-hover:text-violet-400 transition-colors font-medium leading-normal">
                        {post.content}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-white/40 shrink-0 bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg leading-normal">
                      {post.time}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Connected Accounts + Notifications ── */}
      <div className="grid grid-cols-12" style={{ gap: "24px" }}>

        {/* Connected Accounts */}
        <div className="col-span-12 lg:col-span-6 dash-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-bold text-white">Connected Accounts</h2>
              <p className="text-xs text-white/40 mt-0.5">
                {connectedAccounts.filter((a) => a.status === "connected").length} platform{connectedAccounts.length !== 1 ? "s" : ""} active
              </p>
            </div>
            <Link href="/accounts" className="flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 px-3 py-1.5 rounded-xl transition-all">
              <Plus size={12} /> Add
            </Link>
          </div>
          <div className="space-y-2.5">
            {connectedAccounts.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-6">No accounts connected yet.</p>
            ) : (
              connectedAccounts.map((acc) => {
                const color = platformColors[acc.platform.toLowerCase()] ?? "#7c3aed";
                const Icon = platformIcons[acc.platform.toLowerCase()] ?? Activity;
                return (
                  <div key={acc.id} className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: `${color}22`, border: `1px solid ${color}33` }}>
                      <Icon size={16} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white/95 leading-none mb-0.5 capitalize">{acc.platform}</p>
                      <p className="text-xs text-white/40 truncate">{acc.account_name}</p>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${
                      acc.status === "connected" ? "bg-emerald-400" : "bg-white/20"
                    }`} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="col-span-12 lg:col-span-6 dash-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-bold text-white">Notifications</h2>
              <p className="text-xs text-white/40 mt-0.5">
                <span className="text-violet-400 font-bold">
                  {mockNotifications.filter((n) => !n.read).length}
                </span> unread messages
              </p>
            </div>
            <Link href="/notifications" className="text-xs font-bold text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 px-3 py-1.5 rounded-xl transition-all">
              View all
            </Link>
          </div>
          <div className="space-y-1">
            {mockNotifications.slice(0, 6).map((n) => {
              const style = notifTypeStyles[n.type] ?? { bg: "bg-white/10", text: "text-white/50", emoji: "i" };
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-3.5 py-3 rounded-2xl transition-all cursor-pointer hover:bg-white/5 ${!n.read ? "bg-violet-500/10 border border-violet-500/20" : "border border-transparent"
                    }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${style.bg} ${style.text}`}
                  >
                    {style.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] leading-snug ${!n.read ? "font-semibold text-white" : "text-white/60"}`}>
                      {n.message}
                    </p>
                    <p className="text-[11px] text-white/40 mt-0.5 font-medium">{n.time}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-2 shadow-sm shadow-violet-300" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
