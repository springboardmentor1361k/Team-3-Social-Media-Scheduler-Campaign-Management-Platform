"use client";

import { useState, useEffect } from "react";
import {
  Users, Shield, Mail, MoreHorizontal,
  UserPlus, Search, Filter, CheckCircle2, XCircle, Clock, Loader2,
} from "lucide-react";
import { apiListUsers, UserOut } from "@/lib/api";

type UserStatus = "active" | "inactive";
type MemberRole = "administrator" | "content_creator" | "marketing_team" | "business_user";

const roleLabels: Record<string, string> = {
  administrator:   "Admin",
  content_creator: "Content Creator",
  marketing_team:  "Marketing Team",
  business_user:   "Business User",
};

const roleColors: Record<string, string> = {
  administrator:   "bg-red-500/15 text-red-400 border-red-500/25",
  content_creator: "bg-violet-500/15 text-violet-400 border-violet-500/25",
  marketing_team:  "bg-blue-500/15 text-blue-400 border-blue-500/25",
  business_user:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
};

const statusConfig = {
  active:   { icon: CheckCircle2, class: "text-emerald-400", bg: "bg-emerald-500/10", label: "Active"   },
  inactive: { icon: XCircle,      class: "text-red-400",     bg: "bg-red-500/10",     label: "Inactive" },
};

export default function UserManagementView() {
  const [search,     setSearch]     = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [users,      setUsers]      = useState<UserOut[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  useEffect(() => {
    apiListUsers()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "All" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const stats = {
    total:  users.length,
    active: users.filter((u) => u.is_active).length,
    inactive: users.filter((u) => !u.is_active).length,
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1440px] mx-auto">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-400" />
          <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-2.5 py-0.5">
            Admin Only
          </span>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-900/30">
          <UserPlus size={15} /> Invite User
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {[
          { label: "Total Users", value: stats.total,    color: "text-violet-400",  bg: "bg-violet-500/10"  },
          { label: "Active",      value: stats.active,   color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Inactive",    value: stats.inactive, color: "text-red-400",     bg: "bg-red-500/10"     },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="dash-card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center`}>
              <Users className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-white/40 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="dash-card p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-white/40 shrink-0" />
            {(["All", "administrator", "content_creator", "marketing_team", "business_user"]).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${
                  filterRole === r
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
                }`}
              >
                {r === "All" ? "All" : roleLabels[r]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="dash-card overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        )}
        {error && <p className="text-sm text-red-400 font-semibold p-6">{error}</p>}
        {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[11px] font-black text-white/30 uppercase tracking-wider px-6 py-4">User</th>
                <th className="text-left text-[11px] font-black text-white/30 uppercase tracking-wider px-4 py-4">Role</th>
                <th className="text-left text-[11px] font-black text-white/30 uppercase tracking-wider px-4 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const status = user.is_active ? statusConfig.active : statusConfig.inactive;
                const StatusIcon = status.icon;
                return (
                  <tr key={user.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-xs font-black text-white shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{user.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Mail size={10} className="text-white/30" />
                            <p className="text-xs text-white/40">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${roleColors[user.role] ?? "bg-white/10 text-white/50 border-white/10"}`}>
                        {roleLabels[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${status.bg}`}>
                        <StatusIcon size={11} className={status.class} />
                        <span className={`text-[11px] font-semibold ${status.class}`}>{status.label}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-white/30">
              <Users size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No users found</p>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
