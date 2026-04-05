"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/site/toast-viewport";

type Subscriber = {
  id: string;
  email: string;
  active: boolean;
  createdAt: string;
};

export default function AdminNewsletterPage() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubscribers() {
      const res = await fetch("/api/admin/newsletter");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await res.json();
      setSubscribers(Array.isArray(data.subscribers) ? data.subscribers : []);
      setLoading(false);
    }

    loadSubscribers();
  }, [router]);

  const filtered = useMemo(
    () => subscribers.filter((item) => item.email.toLowerCase().includes(search.toLowerCase())),
    [subscribers, search]
  );

  async function toggleStatus(subscriber: Subscriber) {
    setBusyId(subscriber.id);
    const nextActive = !subscriber.active;

    const res = await fetch("/api/admin/newsletter", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: subscriber.id, active: nextActive }),
    });

    const data = await res.json();
    setBusyId(null);

    if (!res.ok) {
      showToast({
        title: "Newsletter update failed",
        description: data.error || "Failed to update subscriber",
        tone: "error",
      });
      return;
    }

    setSubscribers((prev) =>
      prev.map((item) => (item.id === subscriber.id ? data.subscriber : item))
    );

    showToast({
      title: nextActive ? "Subscriber restored" : "Subscriber blocked",
      description: nextActive
        ? "This email can subscribe again."
        : "This email will now be blocked from newsletter signup.",
      tone: "success",
    });
  }

  if (loading) {
    return <div className="py-20 font-mono text-sm text-muted">Loading newsletter subscribers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Newsletter</h1>
          <p className="mt-1 text-sm text-muted">
            {subscribers.length} email{subscribers.length !== 1 ? "s" : ""} collected
          </p>
        </div>
        <div className="w-full sm:w-72">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search email..."
            className="input-field"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-3 font-mono text-xs text-muted">EMAIL</th>
                <th className="px-5 py-3 font-mono text-xs text-muted">STATUS</th>
                <th className="px-5 py-3 font-mono text-xs text-muted">JOINED</th>
                <th className="px-5 py-3 font-mono text-xs text-muted">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((subscriber) => (
                <tr key={subscriber.id} className="hover:bg-surface-raised/40">
                  <td className="px-5 py-3 font-mono text-xs text-foreground">{subscriber.email}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] ${subscriber.active ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger"}`}>
                      {subscriber.active ? "ACTIVE" : "BLOCKED"}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted">
                    {new Date(subscriber.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      disabled={busyId === subscriber.id}
                      onClick={() => void toggleStatus(subscriber)}
                      className={`rounded-full border px-3 py-1 font-mono text-[11px] transition-all disabled:opacity-50 ${subscriber.active ? "border-danger/30 text-danger hover:bg-danger/10" : "border-accent/30 text-accent hover:bg-accent/10"}`}
                    >
                      {busyId === subscriber.id
                        ? "Working..."
                        : subscriber.active
                          ? "Block email"
                          : "Unblock email"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center font-mono text-sm text-muted">
            No newsletter emails found.
          </div>
        ) : null}
      </div>
    </div>
  );
}
