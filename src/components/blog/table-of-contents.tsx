"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/types/blog";

interface TableOfContentsProps {
  items: TocItem[];
}

/**
 * Sticky TOC with scroll-spy: highlights the section nearest the top of the viewport.
 * Anchors match `rehype-slug` ids on headings in the article.
 */
export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    const elements = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el != null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-10% 0px -80% 0px",
        threshold: [0, 0.25, 0.5, 1],
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="rounded-xl border border-border bg-surface p-4 text-sm"
    >
      <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted">
        On this page
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => {
          const isActive = activeId === item.id;
          const pad = item.level === 3 ? "pl-4" : "";
          return (
            <li key={item.id} className={pad}>
              <a
                href={`#${item.id}`}
                className={`block border-l-2 py-1 pl-3 text-left text-sm leading-5 transition-all ${
                  isActive
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted hover:border-border-hover hover:text-foreground"
                }`}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
