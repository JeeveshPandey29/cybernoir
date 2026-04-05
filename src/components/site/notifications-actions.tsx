"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NotificationsActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markAllRead() {
    setLoading(true);
    await fetch("/api/notifications/read-all", { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button type="button" onClick={() => void markAllRead()} disabled={loading} className="btn-outline font-mono text-xs disabled:opacity-50">
      {loading ? "Updating..." : "Mark all as read"}
    </button>
  );
}
