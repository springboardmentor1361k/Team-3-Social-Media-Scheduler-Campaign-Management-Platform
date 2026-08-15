"use client";

import dynamic from "next/dynamic";

const AnalyticsView = dynamic(() => import("@/components/views/AnalyticsView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh] text-white/50 text-sm font-semibold">
      Loading Analytics...
    </div>
  ),
});

export default function AnalyticsPage() {
  return <AnalyticsView />;
}
