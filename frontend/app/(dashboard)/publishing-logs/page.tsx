"use client";

import dynamic from "next/dynamic";

const PublishingLogsView = dynamic(
  () => import("@/components/views/PublishingLogsView"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh] text-white/50 text-sm font-semibold">
        Loading Publishing Logs...
      </div>
    ),
  }
);

export default function PublishingLogsPage() {
  return <PublishingLogsView />;
}
