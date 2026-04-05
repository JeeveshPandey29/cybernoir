"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Stats {
  totalUsers: number;
  totalBlogs: number;
  totalComments: number;
  totalLikes: number;
  totalBookmarks: number;
  recentUsers: {
    id: string;
    username: string;
    email: string;
    createdAt: string;
  }[];
}

const emptyStats: Stats = {
  totalUsers: 0,
  totalBlogs: 0,
  totalComments: 0,
  totalLikes: 0,
  totalBookmarks: 0,
  recentUsers: [],
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");

        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          setStats(emptyStats);
          return;
        }

        setStats({
          totalUsers: data.totalUsers ?? 0,
          totalBlogs: data.totalBlogs ?? 0,
          totalComments: data.totalComments ?? 0,
          totalLikes: data.totalLikes ?? 0,
          totalBookmarks: data.totalBookmarks ?? 0,
          recentUsers: Array.isArray(data.recentUsers) ? data.recentUsers : [],
        });
      } catch {
        setStats(emptyStats);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-mono text-sm text-muted">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: "👥", color: "accent" },
    { label: "Total Blogs", value: stats.totalBlogs, icon: "📝", color: "accent" },
    { label: "Comments", value: stats.totalComments, icon: "💬", color: "accent" },
    { label: "Likes", value: stats.totalLikes, icon: "❤️", color: "accent" },
    { label: "Bookmarks", value: stats.totalBookmarks, icon: "🔖", color: "accent" },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Overview of your CYBERNOIR platform.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <div key={stat.label} className="glass-card stat-glow p-5">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
              <span className="badge badge-accent font-mono text-[10px]">LIVE</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-1 font-mono text-xs text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Author Profile</p>
          <h2 className="mt-2 text-lg font-semibold text-foreground">Manage Jeevesh Pandey public details</h2>
          <p className="mt-1 text-sm text-muted">
            Edit the bio, avatar, and public links shown on each blog author card and author page.
          </p>
        </div>
        <a href="/admin/author" className="btn-outline font-mono text-xs">
          Edit author profile
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card flex flex-col gap-3 p-5">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Security</p>
          <h2 className="text-lg font-semibold text-foreground">Admin MFA setup</h2>
          <p className="text-sm text-muted">Open the security page to copy the setup key and generated otpauth URI for Google Authenticator.</p>
          <a href="/admin/security" className="btn-outline inline-flex w-fit font-mono text-xs">
            Open security
          </a>
        </div>

        <div className="glass-card flex flex-col gap-3 p-5">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Audit Logs</p>
          <h2 className="text-lg font-semibold text-foreground">Review security events</h2>
          <p className="text-sm text-muted">See signups, login failures, admin access attempts, and profile change events from Supabase logs.</p>
          <a href="/admin/logs" className="btn-outline inline-flex w-fit font-mono text-xs">
            Open logs
          </a>
        </div>
      </div>

      {/* Recent Users */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h3 className="font-semibold text-foreground">Recent Users</h3>
          <p className="mt-0.5 text-xs text-muted">Latest signups on the platform</p>
        </div>
        {stats.recentUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-3xl mb-3">👥</span>
            <p className="font-mono text-sm text-muted">No users yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 font-mono text-xs font-medium text-muted">USERNAME</th>
                  <th className="px-6 py-3 font-mono text-xs font-medium text-muted">EMAIL</th>
                  <th className="px-6 py-3 font-mono text-xs font-medium text-muted">JOINED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.recentUsers.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-surface-raised/50">
                    <td className="px-6 py-3 text-sm text-foreground">{user.username}</td>
                    <td className="px-6 py-3 font-mono text-xs text-muted">{user.email}</td>
                    <td className="px-6 py-3 font-mono text-xs text-muted">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
