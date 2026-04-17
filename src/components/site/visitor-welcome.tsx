"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const STORAGE_KEY = "cybernoir-visitor-welcome";

export function VisitorWelcome() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname === "/login" || pathname === "/signup") {
      setOpen(false);
      setDismissing(false);
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

  function closeModal() {
    setDismissing(true);
    window.setTimeout(() => {
      setOpen(false);
      setDismissing(false);
    }, 140);
  }

  function goTo(path: "/login" | "/signup") {
    closeModal();
    router.push(path);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-background/55 px-4 backdrop-blur-md">
      <div
        className={`pointer-events-auto relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-accent/30 bg-surface/95 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-150 sm:p-6 ${
          dismissing ? "scale-[0.98] opacity-0" : "animate-feedback-pop"
        }`}
      >
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-raised/60 text-muted transition-colors hover:border-border-hover hover:text-foreground"
          aria-label="Close welcome prompt"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 6 18 18" strokeLinecap="round" />
            <path d="m18 6-12 12" strokeLinecap="round" />
          </svg>
        </button>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-border/70">
          <div
            className="animate-toast-progress h-full origin-left bg-gradient-to-r from-accent to-accent-dim"
            style={{ animationDuration: "7000ms" }}
          />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">Continue with account</p>
        <h3 className="mt-2 pr-8 text-xl font-semibold text-foreground sm:text-2xl">Welcome to CYBERNOIR</h3>
        <p className="mt-3 text-sm leading-6 text-muted">
          Read as a guest, or sign in to like posts, save bookmarks, and comment.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => goTo("/signup")}
            className="btn-primary px-3 py-2 text-center font-mono text-[11px] sm:text-xs"
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => goTo("/login")}
            className="rounded-xl border border-border bg-surface-raised/45 px-3 py-2 text-center font-mono text-[11px] text-foreground transition-colors hover:border-border-hover sm:text-xs"
          >
            Login
          </button>
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={closeModal}
            className="w-full rounded-xl border border-border px-3 py-2 font-mono text-[11px] text-muted transition-colors hover:border-border-hover hover:text-foreground sm:text-xs"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
