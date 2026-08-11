"use client";

import dynamic from "next/dynamic";

const DashboardView = dynamic(() => import("@/components/DashboardView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh] text-white/50 text-sm font-semibold">
      Loading Dashboard...
    </div>
  ),
});

export default function DashboardPage() {
  return <DashboardView />;
}
