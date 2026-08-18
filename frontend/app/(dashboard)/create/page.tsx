"use client";

import dynamic from "next/dynamic";

const CreatePostView = dynamic(() => import("@/components/CreatePostView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh] text-white/50 text-sm font-semibold">
      Loading Composer...
    </div>
  ),
});

export default function CreatePostPage() {
  return <CreatePostView />;
}
