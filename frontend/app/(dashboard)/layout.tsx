"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { ViewProvider } from "@/lib/viewContext";
import { useRole, hasAccess } from "@/lib/roleStore";

function AccessDenied({ view }: { view: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="text-center p-10">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔒</span>
        </div>
        <h2 className="text-xl font-black text-white mb-2">Access Restricted</h2>
        <p className="text-sm text-white/40">
          Your role does not have permission to view <strong className="text-white/70">{view}</strong>.
        </p>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const role = useRole();
  const pathname = usePathname();

  // Determine the view name from pathname
  const view = pathname ? pathname.split("/").pop() || "dashboard" : "dashboard";
  const isAllowed = hasAccess(role, view);

  return (
    <ViewProvider>
      <div className="flex h-screen auth-bg overflow-hidden relative">
        <div className="auth-orb-1 opacity-60" />
        <div className="auth-orb-2 opacity-50" />
        <div className="auth-orb-3 opacity-40" />

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative z-10">
          <Header onMenuClick={() => setSidebarOpen((v) => !v)} />
          <main className="flex-1 min-h-0 overflow-y-auto relative w-full">
            {isAllowed ? children : <AccessDenied view={view} />}
          </main>
        </div>
      </div>
    </ViewProvider>
  );
}
