"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Sends readers to /blogs with ?q= for client-side filtering on the listing page.
 */
export function NavSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) router.push(`/blogs?q=${encodeURIComponent(trimmed)}`);
    else router.push("/blogs");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative flex min-w-[200px] flex-1 sm:max-w-xs sm:flex-none"
      role="search"
    >
      <label htmlFor="site-search" className="sr-only">
        Search write-ups
      </label>
      <span
        className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted"
        aria-hidden
      >
        ⌕
      </span>
      <input
        id="site-search"
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search write-ups…"
        autoComplete="off"
        className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 font-mono text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-muted-foreground"
      />
    </form>
  );
}
