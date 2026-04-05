"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface BlogData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string;
  coverImage: string | null;
  published: boolean;
  scheduledFor?: string | null;
  comments: {
    id: string;
    content: string;
    createdAt: string;
    parentId?: string | null;
    reportCount?: number;
    likeCount?: number;
    user: { username: string; email: string };
  }[];
  _count: { likes: number; bookmarks: number };
}

export default function AdminEditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [blog, setBlog] = useState<BlogData | null>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [published, setPublished] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingComment, setDeletingComment] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlog() {
      const res = await fetch(`/api/admin/blogs/${id}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) {
        router.push("/admin/blogs");
        return;
      }
      const data = await res.json();
      const b = data.blog;
      setBlog(b);
      setTitle(b.title);
      setExcerpt(b.excerpt);
      setContent(b.content);
      setTags(b.tags);
      setCoverImage(b.coverImage || "");
      setPublished(b.published);
      setScheduledFor(b.scheduledFor ? b.scheduledFor.slice(0, 16) : "");
      setLoading(false);
    }
    void fetchBlog();
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/blogs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, excerpt, tags, coverImage, published, scheduledFor }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update");
        setSaving(false);
        return;
      }

      router.push("/admin/blogs");
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    setDeletingComment(commentId);
    const res = await fetch(`/api/admin/comments/${commentId}`, { method: "DELETE" });
    if (res.ok && blog) {
      setBlog({ ...blog, comments: blog.comments.filter((c) => c.id !== commentId) });
    }
    setDeletingComment(null);
  }

  if (loading) {
    return <div className="py-24 text-center font-mono text-sm text-muted">Loading blog...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Post</h1>
          <p className="mt-1 font-mono text-sm text-muted">/{blog?.slug}</p>
        </div>
        <Link href="/admin/blogs" className="rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-muted transition-all hover:border-border-hover hover:text-foreground">{"< Back"}</Link>
      </div>

      {blog ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-4 text-center"><p className="text-xl font-bold text-foreground">{blog._count.likes}</p><p className="font-mono text-xs text-muted">Likes</p></div>
          <div className="glass-card p-4 text-center"><p className="text-xl font-bold text-foreground">{blog.comments.length}</p><p className="font-mono text-xs text-muted">Comments</p></div>
          <div className="glass-card p-4 text-center"><p className="text-xl font-bold text-foreground">{blog._count.bookmarks}</p><p className="font-mono text-xs text-muted">Bookmarks</p></div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="glass-card space-y-6 p-6 sm:p-8">
        <div><label htmlFor="edit-title" className="mb-1.5 block font-mono text-xs font-medium text-muted">TITLE</label><input id="edit-title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" /></div>
        <div><label htmlFor="edit-excerpt" className="mb-1.5 block font-mono text-xs font-medium text-muted">EXCERPT</label><textarea id="edit-excerpt" required rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="input-field resize-none" /></div>
        <div><label htmlFor="edit-content" className="mb-1.5 block font-mono text-xs font-medium text-muted">CONTENT (MARKDOWN)</label><textarea id="edit-content" required rows={16} value={content} onChange={(e) => setContent(e.target.value)} className="input-field resize-y font-mono text-sm" /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label htmlFor="edit-tags" className="mb-1.5 block font-mono text-xs font-medium text-muted">TAGS</label><input id="edit-tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="input-field" /></div>
          <div><label htmlFor="edit-cover" className="mb-1.5 block font-mono text-xs font-medium text-muted">COVER IMAGE URL</label><input id="edit-cover" type="text" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} className="input-field" /></div>
        </div>
        <div><label htmlFor="edit-scheduled" className="mb-1.5 block font-mono text-xs font-medium text-muted">SCHEDULED PUBLISH</label><input id="edit-scheduled" type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className="input-field" /></div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setPublished(!published)} className={`relative h-6 w-11 rounded-full transition-colors ${published ? "bg-accent" : "bg-border"}`}>
            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${published ? "translate-x-5" : ""}`} />
          </button>
          <span className="font-mono text-xs text-muted">{published ? "Published" : "Draft or scheduled"}</span>
        </div>
        {error ? <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div> : null}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary font-mono text-sm disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
          <Link href="/admin/blogs" className="font-mono text-xs text-muted transition-colors hover:text-foreground">Cancel</Link>
        </div>
      </form>

      {blog && blog.comments.length > 0 ? (
        <div className="glass-card overflow-hidden">
          <div className="border-b border-border px-6 py-4"><h3 className="font-semibold text-foreground">Comments ({blog.comments.length})</h3></div>
          <div className="divide-y divide-border">
            {blog.comments.map((comment) => (
              <div key={comment.id} className="flex items-start justify-between gap-4 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{comment.user.username}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{comment.user.email}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    {comment.reportCount ? <span className="rounded-full border border-warning/30 px-2 py-0.5 font-mono text-[10px] text-warning">{comment.reportCount} reports</span> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted">{comment.content}</p>
                </div>
                <button onClick={() => void handleDeleteComment(comment.id)} disabled={deletingComment === comment.id} className="shrink-0 rounded border border-danger/30 px-2 py-1 font-mono text-[10px] text-danger transition-all hover:bg-danger/10 disabled:opacity-50">
                  {deletingComment === comment.id ? "..." : "Delete"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
