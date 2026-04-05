"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
  role: string;
  createdAt: string;
  _count: {
    comments: number;
    likes: number;
    bookmarks: number;
  };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch("/api/admin/users");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
      setLoading(false);
    }
    fetchUsers();
  }, [router]);

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-mono text-sm text-muted">Loading users…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="mt-1 text-sm text-muted">
            {users.length} registered user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      {/* Users table */}
      {filteredUsers.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16">
          <span className="text-4xl mb-4">👥</span>
          <p className="font-mono text-sm text-muted">
            {search ? "No users match your search" : "No users yet"}
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 font-mono text-xs font-medium text-muted">USER</th>
                  <th className="px-5 py-3 font-mono text-xs font-medium text-muted">EMAIL</th>
                  <th className="px-5 py-3 font-mono text-xs font-medium text-muted">ROLE</th>
                  <th className="px-5 py-3 font-mono text-xs font-medium text-muted text-center">💬</th>
                  <th className="px-5 py-3 font-mono text-xs font-medium text-muted text-center">❤️</th>
                  <th className="px-5 py-3 font-mono text-xs font-medium text-muted text-center">🔖</th>
                  <th className="px-5 py-3 font-mono text-xs font-medium text-muted">JOINED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-surface-raised/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 border border-accent/20 text-sm">
                          {user.avatar || user.role === "ADMIN" ? (
                            <Image
                              src={user.avatar || "/images/jeevesh-pandey.svg"}
                              alt={user.username}
                              width={32}
                              height={32}
                              unoptimized
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-accent font-mono text-xs">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {user.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{user.email}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`badge font-mono text-[10px] ${
                          user.role === "ADMIN" ? "badge-accent" : ""
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center font-mono text-xs text-muted">
                      {user._count.comments}
                    </td>
                    <td className="px-5 py-3 text-center font-mono text-xs text-muted">
                      {user._count.likes}
                    </td>
                    <td className="px-5 py-3 text-center font-mono text-xs text-muted">
                      {user._count.bookmarks}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
