"use client";

import dynamic from "next/dynamic";

const AccountsView = dynamic(() => import("@/components/views/AccountsView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh] text-white/50 text-sm font-semibold">
      Loading Connected Accounts...
    </div>
  ),
});

export default function AccountsPage() {
  return <AccountsView />;
}
