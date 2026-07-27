"use client";

import dynamic from "next/dynamic";

const CampaignsView = dynamic(() => import("@/components/views/CampaignsView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh] text-white/50 text-sm font-semibold">
      Loading Campaigns...
    </div>
  ),
});

export default function CampaignsPage() {
  return <CampaignsView />;
}
