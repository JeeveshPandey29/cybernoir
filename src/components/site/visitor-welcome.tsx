"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "cybernoir-visitor-welcome";

export function VisitorWelcome() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname === "/login" || pathname === "/signup") {
      return;
    }

    const seen = window.sessionStorage.getItem(STORAGE_KEY);
    if (seen) {
      return;
    }

    const referrer = document.referrer;
    const fromExternal =
      !referrer || !referrer.includes(window.location.host);

    if (!fromExternal) {
      return;
    }

    window.sessionStorage.setItem(STORAGE_KEY, "1");
    setOpen(true);
    const timer = window.setTimeout(() => setOpen(false), 7000);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!open) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-background/45 px-4 backdrop-blur-sm">
      <div className="pointer-events-auto relative w-full max-w-md animate-feedback-pop overflow-hidden rounded-[1.75rem] border border-accent/30 bg-surface/95 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-6">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-border/70">
          <div
            className="animate-toast-progress h-full origin-left bg-gradient-to-r from-accent to-accent-dim"
            style={{ animationDuration: "7000ms" }}
          />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">Hello</p>
        <h3 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">Welcome to CYBERNOIR</h3>
        <p className="mt-3 text-sm leading-6 text-muted">
          Explore freely, or sign in to like, bookmark, and join the discussion.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link href="/signup" className="btn-primary px-3 py-2 text-center font-mono text-[11px] sm:text-xs">
            Sign Up
          </Link>
          <Link href="/login" className="rounded-xl border border-border bg-surface-raised/45 px-3 py-2 text-center font-mono text-[11px] text-foreground transition-colors hover:border-border-hover sm:text-xs">
            Login
          </Link>
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full rounded-xl border border-border px-3 py-2 font-mono text-[11px] text-muted transition-colors hover:border-border-hover hover:text-foreground sm:text-xs"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
