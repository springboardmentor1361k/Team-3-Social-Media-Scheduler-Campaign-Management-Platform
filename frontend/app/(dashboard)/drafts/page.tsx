"use client";

import dynamic from "next/dynamic";

const DraftsView = dynamic(() => import("@/components/views/DraftsView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh] text-white/50 text-sm font-semibold">
      Loading Drafts Management...
    </div>
  ),
});

export default function DraftsPage() {
  return <DraftsView />;
}
