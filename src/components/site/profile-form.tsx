"use client";

import Image from "next/image";
import { useState } from "react";
import { showToast } from "@/components/site/toast-viewport";

export function ProfileForm({
  user,
  endpoint = "/api/profile",
  successMessage = "Profile updated. Refresh the page to see the newest header details.",
}: {
  user: {
    username: string;
    email: string;
    avatar: string | null;
    role: string;
    bio?: string;
    websiteUrl?: string | null;
    xUrl?: string | null;
    linkedinUrl?: string | null;
  };
  endpoint?: string;
  successMessage?: string;
}) {
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(user.websiteUrl ?? "");
  const [xUrl, setXUrl] = useState(user.xUrl ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(user.linkedinUrl ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, avatar, bio, websiteUrl, xUrl, linkedinUrl }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      showToast({
        title: "Update failed",
        description: data.error || "Failed to update profile",
        tone: "error",
      });
      return;
    }

    showToast({
      title: "Profile saved",
      description: successMessage,
      tone: "success",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card space-y-6 p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-accent/25 bg-accent/10">
          {avatar ? (
            <Image src={avatar} alt={username} fill unoptimized className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-2xl text-accent">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">{username}</p>
          <p className="font-mono text-xs text-muted">This username is shown publicly on comments and author cards.</p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-accent">{user.role}</p>
        </div>
      </div>

      <div>
        <label htmlFor="profile-username" className="mb-1.5 block font-mono text-xs font-medium text-muted">
          USERNAME
        </label>
        <input id="profile-username" value={username} onChange={(event) => setUsername(event.target.value)} className="input-field" />
      </div>

      <div>
        <label htmlFor="profile-avatar" className="mb-1.5 block font-mono text-xs font-medium text-muted">
          AVATAR URL
        </label>
        <input id="profile-avatar" value={avatar} onChange={(event) => setAvatar(event.target.value)} className="input-field" placeholder="https://..." />
      </div>

      <div>
        <label htmlFor="profile-bio" className="mb-1.5 block font-mono text-xs font-medium text-muted">
          AUTHOR BIO
        </label>
        <textarea id="profile-bio" rows={4} value={bio} onChange={(event) => setBio(event.target.value)} className="input-field resize-y" placeholder="Tell readers who you are and what you write about." />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="profile-website" className="mb-1.5 block font-mono text-xs font-medium text-muted">WEBSITE</label>
          <input id="profile-website" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} className="input-field" placeholder="https://site.com" />
        </div>
        <div>
          <label htmlFor="profile-x" className="mb-1.5 block font-mono text-xs font-medium text-muted">X URL</label>
          <input id="profile-x" value={xUrl} onChange={(event) => setXUrl(event.target.value)} className="input-field" placeholder="https://x.com/..." />
        </div>
        <div>
          <label htmlFor="profile-linkedin" className="mb-1.5 block font-mono text-xs font-medium text-muted">LINKEDIN</label>
          <input id="profile-linkedin" value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} className="input-field" placeholder="https://linkedin.com/in/..." />
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-primary font-mono text-sm disabled:opacity-50">
        {saving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
