"use client";

import dynamic from "next/dynamic";

const TeamManagementView = dynamic(() => import("@/components/views/TeamManagementView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh] text-white/50 text-sm font-semibold">
      Loading Team Management...
    </div>
  ),
});

export default function TeamsPage() {
  return <TeamManagementView />;
}
