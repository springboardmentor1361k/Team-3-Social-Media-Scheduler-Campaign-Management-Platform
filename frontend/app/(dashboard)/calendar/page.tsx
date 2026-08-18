"use client";

import dynamic from "next/dynamic";

const CalendarView = dynamic(() => import("@/components/CalendarView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh] text-white/50 text-sm font-semibold">
      Loading Calendar...
    </div>
  ),
});

export default function CalendarPage() {
  return <CalendarView />;
}
