"use client";

import dynamic from "next/dynamic";

const RecurringView = dynamic(() => import("@/components/views/RecurringView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh] text-white/50 text-sm font-semibold">
      Loading Recurring Schedules...
    </div>
  ),
});

export default function RecurringPage() {
  return <RecurringView />;
}
