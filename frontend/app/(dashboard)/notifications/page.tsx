"use client";

import dynamic from "next/dynamic";

const NotificationsView = dynamic(() => import("@/components/views/NotificationsView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh] text-white/50 text-sm font-semibold">
      Loading Notifications...
    </div>
  ),
});

export default function NotificationsPage() {
  return <NotificationsView />;
}
