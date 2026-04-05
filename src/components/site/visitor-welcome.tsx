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
    const timer = window.setTimeout(() => setOpen(false), 3000);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!open) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 top-24 z-[60] flex justify-center sm:top-20">
      <div className="pointer-events-auto w-full max-w-sm animate-feedback-pop rounded-3xl border border-accent/30 bg-surface/95 p-4 shadow-2xl shadow-black/35 backdrop-blur-xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">Hello</p>
        <h3 className="mt-2 text-lg font-semibold text-foreground">Welcome to CYBERNOIR</h3>
        <p className="mt-2 text-sm leading-6 text-muted">
          Explore freely, or sign in to like, bookmark, and join the discussion.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/signup" className="btn-primary px-3 py-2 font-mono text-[11px]">
            Sign Up
          </Link>
          <Link href="/login" className="rounded-xl border border-border px-3 py-2 font-mono text-[11px] text-foreground transition-colors hover:border-border-hover">
            Login
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-border px-3 py-2 font-mono text-[11px] text-muted transition-colors hover:border-border-hover hover:text-foreground"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
