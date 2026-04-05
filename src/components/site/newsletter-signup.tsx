"use client";

import { useState } from "react";
import { showToast } from "@/components/site/toast-viewport";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      showToast({
        title: "Newsletter join failed",
        description: data.error || "Failed to subscribe",
        tone: "error",
      });
      return;
    }

    setEmail("");
    showToast({
      title: "Subscription successful",
      description: "You are subscribed. New posts will be waiting in your inbox.",
      tone: "success",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card space-y-4 p-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Newsletter</p>
        <h3 className="mt-2 text-xl font-semibold text-foreground">Get new posts and community updates</h3>
        <p className="mt-2 text-sm text-muted">
          Subscribe for release notes, new write-ups, and reply activity.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="input-field"
          required
        />
        <button type="submit" disabled={loading} className="btn-primary font-mono text-xs disabled:opacity-50">
          {loading ? "Joining..." : "Subscribe"}
        </button>
      </div>
    </form>
  );
}
