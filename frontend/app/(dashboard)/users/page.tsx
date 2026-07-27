"use client";

import dynamic from "next/dynamic";

const UserManagementView = dynamic(() => import("@/components/views/UserManagementView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh] text-white/50 text-sm font-semibold">
      Loading User Directory...
    </div>
  ),
});

export default function UsersPage() {
  return <UserManagementView />;
}
