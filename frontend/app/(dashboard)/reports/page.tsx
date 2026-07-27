"use client";

import dynamic from "next/dynamic";

const ReportsView = dynamic(() => import("@/components/views/ReportsView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh] text-white/50 text-sm font-semibold">
      Loading Reports...
    </div>
  ),
});

export default function ReportsPage() {
  return <ReportsView />;
}
