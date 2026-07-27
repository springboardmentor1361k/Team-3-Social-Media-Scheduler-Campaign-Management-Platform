"use client";

import { useState, useEffect } from "react";
import {
  Users, UserPlus, Mail, Crown,
  BarChart2, Settings, Trash2, MoreHorizontal,
} from "lucide-react";
import { apiListTeams } from "@/lib/api";

interface TeamMember {
  name: string; avatar: string; avatarColor: string; role: string; lastActive: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  color: string;
  members: TeamMember[];
  postsThisMonth: number;
  campaigns: number;
}

export default function TeamManagementView() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiListTeams();
        setTeams(data.map((t: any) => ({
          id: t.id.toString(),
          name: t.name,
          description: t.description || "",
          color: t.color || "from-violet-500 to-purple-600",
          members: t.members.map((m: any) => ({
             name: m.name,
             avatar: m.name.substring(0,2).toUpperCase(),
             avatarColor: "#7c3aed",
             role: m.role,
             lastActive: "Just now"
          })),
          postsThisMonth: t.postsThisMonth || 0,
          campaigns: t.campaigns || 0,
        })));
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1440px] mx-auto">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5">
            Admin Only
          </span>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-900/30">
          <UserPlus size={15} /> Create Team
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-6 lg:gap-8">
        {[
          { label: "Total Teams",  value: teams.length,                                  color: "text-violet-400", bg: "from-violet-500/10 to-purple-500/10" },
          { label: "Total Members",value: teams.reduce((acc,t)=>acc+t.members.length,0), color: "text-blue-400",   bg: "from-blue-500/10 to-indigo-500/10"  },
          { label: "Active Campaigns",value: teams.reduce((acc,t)=>acc+t.campaigns,0),   color: "text-emerald-400",bg: "from-emerald-500/10 to-teal-500/10"  },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`dash-card p-6 bg-gradient-to-br ${bg}`}>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
            <p className="text-sm text-white/40 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Team Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {teams.map((team) => (
          <div key={team.id} className="dash-card overflow-hidden">
            {/* Top gradient bar */}
            <div className={`h-1.5 bg-gradient-to-r ${team.color}`} />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-white">{team.name}</h3>
                  <p className="text-xs text-white/40 mt-1 leading-relaxed">{team.description}</p>
                </div>
                <button className="p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                  <MoreHorizontal size={14} />
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-4 mb-5">
                <div className="flex items-center gap-1.5">
                  <BarChart2 size={12} className="text-violet-400" />
                  <span className="text-xs text-white/50">{team.postsThisMonth} posts/mo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Settings size={12} className="text-blue-400" />
                  <span className="text-xs text-white/50">{team.campaigns} campaigns</span>
                </div>
              </div>

              {/* Members */}
              <div className="space-y-2.5">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-wider">Members ({team.members.length})</p>
                {team.members.map((member) => (
                  <div key={member.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{member.name}</p>
                      <p className="text-[10px] text-white/40">{member.role} · {member.lastActive}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add member */}
              <button className="mt-4 w-full flex items-center justify-center gap-2 py-2 border border-dashed border-white/15 rounded-xl text-xs font-semibold text-white/40 hover:text-white hover:border-violet-500/40 hover:bg-violet-500/5 transition-all">
                <Mail size={12} />
                Invite Member
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
