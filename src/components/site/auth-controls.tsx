"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

interface AuthControlsProps {
  user:
    | {
        username: string;
        role: string;
        avatar?: string | null;
        unreadNotifications?: number;
      }
    | null;
}

export function AuthControls({ user }: AuthControlsProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/login" className="rounded-xl border border-border bg-surface px-3 py-2 font-mono text-[11px] text-muted transition-colors hover:border-border-hover hover:text-foreground sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm">
          Login
        </Link>
        <Link href="/signup" className="btn-primary px-3 py-2 font-mono text-[11px] sm:text-xs">
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2.5 py-2 text-left transition-colors hover:border-border-hover sm:gap-3 sm:px-3"
      >
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-accent/25 bg-accent/10 font-mono text-sm text-accent">
          {user.username.charAt(0).toUpperCase()}
          {(user.unreadNotifications ?? 0) > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] text-background">
              {user.unreadNotifications}
            </span>
          ) : null}
        </div>
        <div className="hidden min-w-0 sm:block">
          <p className="text-sm font-semibold text-foreground">{user.username}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{user.role}</p>
        </div>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border border-border bg-surface-raised p-3 shadow-2xl shadow-black/30">
          <div className="border-b border-border px-3 pb-3">
            <p className="text-sm font-semibold text-foreground">{user.username}</p>
            <p className="mt-1 font-mono text-[11px] text-muted">Signed in</p>
          </div>
          <div className="mt-3 space-y-1">
            <Link href="/profile" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-background/50 hover:text-foreground">
              Profile settings
            </Link>
            <Link href="/notifications" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-background/50 hover:text-foreground">
              Notifications{(user.unreadNotifications ?? 0) > 0 ? ` (${user.unreadNotifications})` : ""}
            </Link>
            <Link href="/likes" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-background/50 hover:text-foreground">
              Liked posts
            </Link>
            <Link href="/bookmarks" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-background/50 hover:text-foreground">
              Bookmarked posts
            </Link>
            {user.role === "ADMIN" ? (
              <Link href="/admin" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-background/50 hover:text-foreground">
                Admin panel
              </Link>
            ) : null}
            <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10">
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
