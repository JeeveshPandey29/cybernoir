"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminNewBlogPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [published, setPublished] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, excerpt, tags, coverImage, published, scheduledFor }),
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create blog");
        setLoading(false);
        return;
      }

      router.push("/admin/blogs");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Blog Post</h1>
          <p className="mt-1 text-sm text-muted">Create a new article for CYBERNOIR.</p>
        </div>
        <Link href="/admin/blogs" className="rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-muted transition-all hover:border-border-hover hover:text-foreground">
          {"< Back"}
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="glass-card space-y-6 p-6 sm:p-8">
        <div>
          <label htmlFor="blog-title" className="mb-1.5 block font-mono text-xs font-medium text-muted">TITLE *</label>
          <input id="blog-title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Awesome Blog Post" className="input-field" />
        </div>

        <div>
          <label htmlFor="blog-excerpt" className="mb-1.5 block font-mono text-xs font-medium text-muted">EXCERPT *</label>
          <textarea id="blog-excerpt" required rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="A short summary of the post..." className="input-field resize-none" />
        </div>

        <div>
          <label htmlFor="blog-content" className="mb-1.5 block font-mono text-xs font-medium text-muted">CONTENT (MARKDOWN) *</label>
          <textarea id="blog-content" required rows={16} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your blog post content in markdown..." className="input-field resize-y font-mono text-sm" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="blog-tags" className="mb-1.5 block font-mono text-xs font-medium text-muted">TAGS</label>
            <input id="blog-tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="cybersecurity, cloud, pentest" className="input-field" />
          </div>
          <div>
            <label htmlFor="blog-cover" className="mb-1.5 block font-mono text-xs font-medium text-muted">COVER IMAGE URL</label>
            <input id="blog-cover" type="text" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://example.com/image.jpg" className="input-field" />
          </div>
        </div>

        <div>
          <label htmlFor="blog-scheduled" className="mb-1.5 block font-mono text-xs font-medium text-muted">SCHEDULED PUBLISH (optional)</label>
          <input id="blog-scheduled" type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className="input-field" />
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setPublished(!published)} className={`relative h-6 w-11 rounded-full transition-colors ${published ? "bg-accent" : "bg-border"}`}>
            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${published ? "translate-x-5" : ""}`} />
          </button>
          <span className="font-mono text-xs text-muted">{published ? "Publish immediately" : "Save as draft or use schedule"}</span>
        </div>

        {error ? <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div> : null}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary font-mono text-sm disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Creating..." : "Create Post"}
          </button>
          <Link href="/admin/blogs" className="font-mono text-xs text-muted transition-colors hover:text-foreground">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
