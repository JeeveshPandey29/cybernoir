"use client";

import { useEffect, useState } from "react";

export function ShareButtons({ title }: { title: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  async function copyLink() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);
  const shareLinks = [
    {
      label: "X",
      className: "share-action--x",
      href: url ? `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` : "#",
    },
    {
      label: "LinkedIn",
      className: "share-action--linkedin",
      href: url ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` : "#",
    },
    {
      label: "WhatsApp",
      className: "share-action--whatsapp",
      href: url ? `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` : "#",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-sm">
      <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted">Share</p>
      <div className="grid grid-cols-2 gap-2">
        {shareLinks.map((link) => (
          <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className={`share-action ${link.className}`}>
            <span className="share-action__label">{link.label}</span>
          </a>
        ))}
        <button type="button" onClick={() => void copyLink()} className={`share-action share-action--copy ${copied ? "share-action--active" : ""}`}>
          <span className="share-action__label">{copied ? "Copied" : "Copy link"}</span>
        </button>
      </div>
    </div>
  );
}
