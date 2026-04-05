"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileForm } from "@/components/site/profile-form";

interface AuthorUser {
  username: string;
  email: string;
  avatar: string | null;
  role: string;
  bio?: string;
  websiteUrl?: string | null;
  xUrl?: string | null;
  linkedinUrl?: string | null;
}

export default function AdminAuthorPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthorUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAuthor() {
      const res = await fetch("/api/admin/author");

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        return;
      }

      setUser(data.user ?? null);
      setLoading(false);
    }

    fetchAuthor();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-mono text-sm text-muted">Loading author profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="glass-card p-6">
        <h1 className="text-xl font-semibold text-foreground">Author profile unavailable</h1>
        <p className="mt-2 text-sm text-muted">The admin author account could not be found in the database.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Author profile</p>
          <h1 className="mt-3 text-2xl font-bold text-foreground">Public author details</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Update the bio, avatar, and public links shown on blog author cards and the author page.
          </p>
        </div>
        <Link href={`/authors/${encodeURIComponent(user.username)}`} className="btn-outline font-mono text-xs">
          View public author page
        </Link>
      </div>

      <ProfileForm
        endpoint="/api/admin/author"
        successMessage="Author profile updated."
        user={user}
      />
    </div>
  );
}
