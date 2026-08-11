"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, BarChart2, Calendar, PlusSquare,
  User, Zap, LogOut, X, TrendingUp, Sparkles,
  Users, Shield, Target, FileText, Link2, Bell, Repeat, FolderOpen, Activity,
} from "lucide-react";
import { FaTwitter, FaInstagram, FaFacebook, FaLinkedin } from "react-icons/fa";
import Avatar from "@/components/ui/Avatar";
import { useRole, ROLE_PAGES, roleBadgeColor } from "@/lib/roleStore";
import { useView } from "@/lib/viewContext";
import { apiGetMe, UserOut } from "@/lib/api";
import { clearToken } from "@/lib/authStore";

interface NavItem {
  view: string;
  label: string;
  icon: any;
  href: string;
  badge?: string;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { view: "dashboard",     label: "Dashboard",          icon: LayoutDashboard, href: "/dashboard"      },
  { view: "users",         label: "User Management",    icon: Users,           href: "/users"          },
  { view: "teams",         label: "Team Management",    icon: Shield,          href: "/teams"          },
  { view: "campaigns",     label: "Campaigns",          icon: Target,          href: "/campaigns"      },
  { view: "reports",       label: "Reports",            icon: FileText,        href: "/reports"        },
  { view: "analytics",     label: "Analytics",          icon: BarChart2,       href: "/analytics"      },
  { view: "create",        label: "Create Post",        icon: PlusSquare,      href: "/create"        },
  { view: "calendar",      label: "Scheduled Posts",    icon: Calendar,        href: "/calendar"       },
  { view: "publishing-logs", label: "Publishing Logs",  icon: Activity,        href: "/publishing-logs" },
  { view: "drafts",        label: "Draft Management",   icon: FolderOpen,      href: "/drafts"         },
  { view: "accounts",      label: "Connected Accounts", icon: Link2,           href: "/accounts"       },
  { view: "notifications", label: "Notifications",   icon: Bell,            href: "/notifications"  },
  { view: "profile",       label: "Profile",            icon: User,            href: "/profile"        },
];

const connectedPlatforms = [
  { icon: FaTwitter,   color: "#1da1f2", label: "Twitter",   bg: "rgba(29,161,242,0.1)"  },
  { icon: FaInstagram, color: "#e4405f", label: "Instagram", bg: "rgba(228,64,95,0.1)"   },
  { icon: FaFacebook,  color: "#1877f2", label: "Facebook",  bg: "rgba(24,119,242,0.1)"  },
  { icon: FaLinkedin,  color: "#0077b5", label: "LinkedIn",  bg: "rgba(0,119,181,0.1)"   },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const router = useRouter();
  const role = useRole();
  const { activeView, setView } = useView();
  const [currentUser, setCurrentUser] = useState<UserOut | null>(null);

  useEffect(() => {
    apiGetMe().then(setCurrentUser).catch(() => {});
  }, []);

  const allowedPages = ROLE_PAGES[role] ?? [];
  const navItems = ALL_NAV_ITEMS.filter((item) => allowedPages.includes(item.view));

  const handleNavClick = (item: typeof ALL_NAV_ITEMS[0]) => {
    setView(item.view);
    router.push(item.href);
    onClose();
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden backdrop-blur-sm" onClick={onClose} />
      )}

      <aside
        className={["fixed lg:static inset-y-0 left-0 z-40 flex flex-col w-[260px] shrink-0 h-full transition-transform duration-300 ease-in-out backdrop-blur-2xl border-r border-white/5", open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"].join(" ")}
        style={{ background: "rgba(5, 3, 15, 0.65)" }}
      >
        <div className="h-[2px] bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 shrink-0" />

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.055]">
          <button className="flex items-center gap-3" onClick={() => handleNavClick(ALL_NAV_ITEMS[0])}>
            <div className="relative">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
                <Zap className="w-4 h-4 text-white" fill="white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#080612]" />
            </div>
            <div>
              <p className="text-sm font-black text-white leading-none tracking-tight">SocialPilot</p>
              <p className="text-[10px] text-white/30 mt-0.5 font-medium">Social Manager</p>
            </div>
          </button>
          <button onClick={onClose} className="lg:hidden text-white/35 hover:text-white/75 transition-colors p-1.5 rounded-lg hover:bg-white/8">
            <X size={17} />
          </button>
        </div>

        {/* Role Badge (read-only) */}
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1.5 rounded-xl border ${roleBadgeColor(role)}`}>
            <Shield size={10} />{role}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="text-[9px] font-black text-white/18 uppercase tracking-[0.18em] px-3 mb-3">Main Menu</p>

          {navItems.map(({ view, label, icon: Icon, badge, href }) => {
            const active = activeView === view;
            return (
              <button key={view} onClick={() => handleNavClick({ view, label, icon: Icon, href, badge })}
                className={`sidebar-nav-item w-full text-left ${active ? "active" : ""}`}
              >
                <span className={`nav-icon shrink-0 transition-colors ${active ? "text-violet-300" : ""}`}>
                  <Icon size={17} />
                </span>
                <span className="text-[13.5px] font-semibold flex-1">{label}</span>
                {badge && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                    {badge}
                  </span>
                )}
                {active && !badge && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-300 shrink-0 shadow-sm shadow-violet-300" />}
              </button>
            );
          })}

          {/* Connected Platforms */}
          <div className="mt-5 mb-1">
            <p className="text-[9px] font-black text-white/18 uppercase tracking-[0.18em] px-3 mb-3">Connected</p>
            <div className="flex items-center gap-2 px-3">
              {connectedPlatforms.map(({ icon: Icon, color, label, bg }) => (
                <div key={label} title={label}
                  className="w-9 h-9 rounded-2xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                  style={{ background: bg, border: `1px solid ${color}25` }}
                >
                  <Icon size={14} style={{ color }} />
                </div>
              ))}
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center cursor-pointer border border-dashed border-white/15 hover:border-violet-500/40 hover:bg-violet-500/10 transition-all" title="Add account">
                <span className="text-white/30 text-sm font-black leading-none">+</span>
              </div>
            </div>
          </div>
        </nav>

        {/* User Footer */}
        <div className="px-3 py-4 border-t border-white/[0.055] shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer">
            <Avatar name={currentUser?.name || "U"} size="sm" color="#7c3aed" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white/90 truncate leading-tight">{currentUser?.name ?? ""}</p>
              <p className="text-[11px] text-white/40 font-medium truncate mt-0.5">{role}</p>
            </div>
            <button onClick={() => { clearToken(); router.push("/login"); }}
              className="text-white/22 hover:text-red-400 transition-colors p-1.5 rounded-xl hover:bg-red-500/10 group-hover:opacity-100 opacity-0"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
