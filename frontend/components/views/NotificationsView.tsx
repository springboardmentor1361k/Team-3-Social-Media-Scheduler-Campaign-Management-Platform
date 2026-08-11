"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle2, AlertTriangle, Info, XCircle, Filter, Check } from "lucide-react";
import { apiListNotifications, apiUpdateNotification, apiDeleteNotification } from "@/lib/api";

type NotifType = "success" | "info" | "warning" | "error";

const typeConfig: Record<NotifType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  success: { icon: CheckCircle2,  color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/25", label: "Success"  },
  info:    { icon: Info,          color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/25",       label: "Info"     },
  warning: { icon: AlertTriangle, color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/25",     label: "Warning"  },
  error:   { icon: XCircle,       color: "text-red-400",     bg: "bg-red-500/10 border-red-500/25",         label: "Error"    },
};

export default function NotificationsView() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<NotifType | "all">("all");

  const fetchNotifications = async () => {
    try {
      const data = await apiListNotifications();
      // map backend names if necessary
      const mapped = data.map(n => ({
        id: n.id.toString(),
        type: n.type as NotifType,
        message: n.message,
        time: new Date(n.created_at).toLocaleString(),
        read: n.is_read
      }));
      setNotifications(mapped);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filtered = filter === "all" ? notifications : notifications.filter(n => n.type === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  async function markAllRead() {
    for (const n of notifications.filter(n => !n.read)) {
       await apiUpdateNotification(Number(n.id), true);
    }
    fetchNotifications();
  }

  async function markRead(id: string) {
    await apiUpdateNotification(Number(id), true);
    fetchNotifications();
  }

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1440px] mx-auto">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-2.5 py-0.5">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-black text-white bg-violet-600 rounded-full px-2 py-0.5">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white/70 hover:text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {(["success", "info", "warning", "error"] as NotifType[]).map((type) => {
          const { icon: Icon, color, bg, label } = typeConfig[type];
          const count = notifications.filter(n => n.type === type).length;
          return (
            <div key={type} className="dash-card p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-2xl ${bg.split(" ")[0]} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className={`text-2xl font-black ${color}`}>{count}</p>
                <p className="text-xs text-white/40 mt-0.5">{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <Filter size={13} className="text-white/40 shrink-0" />
        {(["all", "success", "info", "warning", "error"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all capitalize ${
              filter === f
                ? "bg-violet-600 border-violet-500 text-white"
                : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="dash-card divide-y divide-white/[0.04]">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-white/30">
            <Bell size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No notifications</p>
          </div>
        )}
        {filtered.map((notif) => {
          const type = (notif.type ?? "info") as NotifType;
          const { icon: Icon, color, bg } = typeConfig[type];
          return (
            <div
              key={notif.id}
              onClick={() => markRead(String(notif.id))}
              className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-all ${
                !notif.read ? "bg-violet-500/[0.04] hover:bg-violet-500/[0.07]" : "hover:bg-white/[0.02]"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${bg}`}>
                <Icon size={15} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!notif.read ? "font-semibold text-white" : "text-white/60"}`}>
                  {notif.message}
                </p>
                <p className="text-xs text-white/35 mt-1">{notif.time}</p>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-violet-500 shadow-sm shadow-violet-400 shrink-0 mt-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
