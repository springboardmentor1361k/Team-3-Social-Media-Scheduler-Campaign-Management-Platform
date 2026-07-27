"use client";

import dynamic from "next/dynamic";

const ProfileView = dynamic(() => import("@/components/views/ProfileView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh] text-white/50 text-sm font-semibold">
      Loading Profile...
    </div>
  ),
});

export default function ProfilePage() {
  return <ProfileView />;
}
