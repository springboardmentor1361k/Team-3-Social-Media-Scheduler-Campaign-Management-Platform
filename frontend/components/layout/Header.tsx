"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Bell, Menu, ChevronDown,
  User, Settings, HelpCircle, LogOut, Zap,
  TrendingUp, Star, Shield,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { mockNotifications } from "@/lib/mockData";
import { useRole, roleBadgeColor } from "@/lib/roleStore";
import { useView } from "@/lib/viewContext";
import { apiGetMe, UserOut } from "@/lib/api";
import { clearToken } from "@/lib/authStore";

const VIEW_TITLES: Record<string, { title: string; emoji: string; subtitle: string }> = {
  "dashboard":       { title: "Dashboard",             emoji: "👋", subtitle: "Welcome back to SocialPilot" },
  "users":           { title: "User Management",       emoji: "👥", subtitle: "Manage all users, roles and access permissions" },
  "teams":           { title: "Team Management",       emoji: "🛡️", subtitle: "Organize teams, assign roles and access levels" },
  "campaigns":       { title: "Campaign Manager",      emoji: "🎯", subtitle: "Track, manage and analyze all marketing campaigns" },
  "reports":         { title: "Performance Reports",   emoji: "📊", subtitle: "Comprehensive analytics and export insights" },
  "analytics":       { title: "Analytics",             emoji: "📈", subtitle: "Track your performance metrics" },
  "create":          { title: "Create Post",           emoji: "✍️", subtitle: "Craft and schedule your content" },
  "calendar":        { title: "Scheduled Posts",       emoji: "📅", subtitle: "Your content publishing calendar & queue" },
  "publishing-logs": { title: "Publishing Logs",       emoji: "📜", subtitle: "Real-time execution log trace & retry engine" },
  "drafts":          { title: "Draft Management",      emoji: "📂", subtitle: "Review, approve, and manage post drafts" },
  "accounts":        { title: "Connected Accounts",    emoji: "🔗", subtitle: "Manage your linked social connections" },
  "notifications":   { title: "Notifications",         emoji: "🔔", subtitle: "Stay up to date with activity and alerts" },
  "profile":         { title: "Profile",               emoji: "👤", subtitle: "Manage your account settings" },
  "recurring":       { title: "Recurring Schedules",   emoji: "🔄", subtitle: "Automated recurring content schedules" },
};

const notifIcons: Record<string, { bg: string; text: string; icon: string }> = {
  success: { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: "✓" },
  info:    { bg: "bg-violet-500/10",  text: "text-violet-400",  icon: "i" },
  warning: { bg: "bg-amber-500/10",   text: "text-amber-400",   icon: "!" },
  error:   { bg: "bg-red-500/10",     text: "text-red-400",     icon: "✕" },
};

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const role = useRole();
  const { activeView, setView } = useView();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<UserOut | null>(null);

  useEffect(() => {
    apiGetMe().then(setCurrentUser).catch(() => {});
  }, []);

  const displayName = currentUser?.name ?? "";
  const displayEmail = currentUser?.email ?? "";

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);

  const page   = VIEW_TITLES[activeView] ?? { title: "SocialPilot", subtitle: "", emoji: "⚡" };
  const pageSubtitle = activeView === "dashboard" && displayName
    ? `Welcome back, ${displayName.split(" ")[0]}`
    : page.subtitle;
  const unread = mockNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="app-header shrink-0 px-3 sm:px-5 lg:px-7 flex items-center gap-2 sm:gap-4 relative z-30 w-full">

      <button onClick={onMenuClick} className="lg:hidden shrink-0 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all" aria-label="Toggle menu">
        <Menu size={20} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-[17px] font-black text-white leading-none tracking-tight">{page.title}</h1>
          <span className="shrink-0 text-base leading-none">{page.emoji}</span>
        </div>
        {page.subtitle && <p className="text-[12px] text-white/40 mt-1 hidden sm:block font-medium">{pageSubtitle}</p>}
      </div>

      <div className="header-search hidden lg:flex">
        <Search size={15} className="text-white/40 shrink-0" />
        <input type="text" placeholder="Search posts, accounts…" value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-[13.5px] text-white placeholder:text-white/30 outline-none min-w-0"
        />
        {searchQuery && <button onClick={() => setSearchQuery("")} className="text-white/30 hover:text-white text-xs">✕</button>}
      </div>

      <button
        type="button"
        className="lg:hidden shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
        aria-label="Search"
        aria-expanded={searchOpen}
        onClick={() => { setSearchOpen((open) => !open); setNotifOpen(false); setProfileOpen(false); }}
      >
        <Search size={17} />
      </button>

      {searchOpen && (
        <div className="lg:hidden absolute top-full left-3 right-3 sm:left-5 sm:right-5 mt-2 h-12 px-3.5 flex items-center gap-2 rounded-xl border border-white/10 bg-[#0c0818] shadow-xl">
          <Search size={16} className="shrink-0 text-white/40" />
          <input
            autoFocus
            type="text"
            placeholder="Search posts, accounts…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-[13.5px] text-white placeholder:text-white/30 outline-none"
          />
          <button type="button" onClick={() => setSearchOpen(false)} className="text-white/50 hover:text-white text-lg leading-none" aria-label="Close search">×</button>
        </div>
      )}



      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); setSearchOpen(false); }}
          className={`relative shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${notifOpen ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white"}`}
        >
          <Bell size={17} />
          {unread > 0 && <span className="notif-badge">{unread}</span>}
        </button>

        {notifOpen && (
          <div className="dropdown-menu w-[290px] sm:w-[340px]">
            <div className="px-4 py-3.5 flex items-center justify-between border-b border-white/5 mb-1">
              <div>
                <p className="text-[14px] font-black text-white">Notifications</p>
                <p className="text-[11px] text-white/40 mt-0.5">{unread} unread messages</p>
              </div>
              <button onClick={() => { setNotifOpen(false); setView("notifications"); router.push("/notifications"); }}
                className="text-[11px] font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-xl hover:bg-violet-500/20 transition-colors"
              >
                View all
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-0.5 px-1">
              {mockNotifications.slice(0, 5).map((n) => {
                const style = notifIcons[n.type] ?? { bg: "bg-white/5", text: "text-white/40", icon: "i" };
                return (
                  <div key={n.id} className={`flex items-start gap-3 px-3.5 py-3 rounded-2xl cursor-pointer transition-all ${!n.read ? "bg-violet-500/10 hover:bg-violet-500/15" : "hover:bg-white/5"}`}>
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${style.bg} ${style.text}`}>{style.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] leading-snug ${!n.read ? "font-semibold text-white" : "text-white/60"}`}>{n.message}</p>
                      <p className="text-[11px] text-white/40 mt-0.5">{n.time}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1.5" />}
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-white/5 mt-1">
              <button className="text-[12.5px] font-bold text-violet-400 hover:text-violet-300 transition-colors">Mark all read</button>
            </div>
          </div>
        )}
      </div>

      {/* Role Badge (read-only) */}
      <div className="hidden lg:flex">
        <span className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold ${roleBadgeColor(role)}`}>
          <Shield size={12} />{role}
        </span>
      </div>

      {/* Profile */}
      <div className="relative shrink-0" ref={profileRef}>
        <button onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); setSearchOpen(false); }}
          className={`flex w-10 h-10 sm:w-auto sm:h-auto items-center justify-center sm:justify-start gap-2.5 p-1 sm:pl-1 sm:pr-3 sm:py-1 rounded-2xl transition-all ${profileOpen ? "bg-white/10 border border-white/10" : "hover:bg-white/5 border border-transparent"}`}
        >
          <Avatar name={displayName || "U"} size="sm" color="#7c3aed" />
          <div className="hidden sm:block text-left">
            <p className="text-[13px] font-bold text-white leading-tight">{displayName.split(" ")[0] || "User"}</p>
            <p className="text-[10px] text-white/45">{role}</p>
          </div>
          <ChevronDown size={13} className={`hidden sm:block text-white/40 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
        </button>

        {profileOpen && (
          <div className="dropdown-menu">
            <div className="mx-1 mb-2 p-3 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2.5">
                <Avatar name={displayName || "U"} size="sm" color="#7c3aed" />
                <div className="min-w-0">
                  <p className="text-[13px] font-black text-white truncate">{displayName}</p>
                  <p className="text-[11px] text-white/50 truncate">{displayEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1"><Star size={8} fill="currentColor" /> Active User</span>
              </div>
            </div>
            <button className="dropdown-item w-full" onClick={() => { setProfileOpen(false); setView("profile"); router.push("/profile"); }}>
              <User size={15} className="text-white/40" /> My Profile
            </button>
            <button className="dropdown-item w-full" onClick={() => setProfileOpen(false)}>
              <Settings size={15} className="text-white/40" /> Settings
            </button>
            <button type="button" className="dropdown-item w-full">
              <HelpCircle size={15} className="text-white/40" /> Help & Support
            </button>
            <button type="button" className="dropdown-item w-full">
              <TrendingUp size={15} className="text-white/40" /> What&apos;s New
            </button>
            <div className="border-t border-white/5 my-1.5 mx-1" />
            <button type="button" className="dropdown-item danger w-full" onClick={() => { clearToken(); router.push("/login"); }}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
