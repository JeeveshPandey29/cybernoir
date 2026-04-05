"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string;
  published: boolean;
  createdAt: string;
  _count: {
    comments: number;
    likes: number;
    bookmarks: number;
  };
}

export default function AdminBlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function fetchBlogs() {
    const res = await fetch("/api/admin/blogs");
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    const data = await res.json();
    setBlogs(data.blogs || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBlogs((prev) => prev.filter((b) => b.id !== id));
    }
    setDeleting(null);
  }

  async function togglePublish(id: string, published: boolean) {
    const res = await fetch(`/api/admin/blogs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !published }),
    });
    if (res.ok) {
      setBlogs((prev) =>
        prev.map((b) => (b.id === id ? { ...b, published: !published } : b))
      );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-mono text-sm text-muted">Loading blogs…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog Posts</h1>
          <p className="mt-1 text-sm text-muted">
            Manage your blog content — {blogs.length} post{blogs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="btn-primary font-mono text-xs flex items-center gap-2"
        >
          <span>＋</span> New Post
        </Link>
      </div>

      {/* Blog list */}
      {blogs.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16">
          <span className="text-4xl mb-4">📝</span>
          <p className="font-mono text-sm text-muted">No blog posts yet</p>
          <Link
            href="/admin/blogs/new"
            className="mt-4 btn-primary font-mono text-xs"
          >
            Create your first post
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground truncate">
                    {blog.title}
                  </h3>
                  <span
                    className={`badge font-mono text-[10px] ${
                      blog.published ? "badge-accent" : ""
                    }`}
                  >
                    {blog.published ? "PUBLISHED" : "DRAFT"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted truncate">{blog.excerpt}</p>
                <div className="mt-2 flex items-center gap-4 font-mono text-xs text-muted-foreground">
                  <span>❤️ {blog._count.likes}</span>
                  <span>💬 {blog._count.comments}</span>
                  <span>🔖 {blog._count.bookmarks}</span>
                  <span>📅 {new Date(blog.createdAt).toLocaleDateString()}</span>
                </div>
                {blog.tags && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {blog.tags.split(",").map((tag) => (
                      <span key={tag.trim()} className="badge font-mono text-[10px]">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => togglePublish(blog.id, blog.published)}
                  className="rounded-lg border border-border px-3 py-1.5 font-mono text-[11px] text-muted transition-all hover:border-accent hover:text-accent"
                >
                  {blog.published ? "Unpublish" : "Publish"}
                </button>
                <Link
                  href={`/admin/blogs/${blog.id}/edit`}
                  className="rounded-lg border border-border px-3 py-1.5 font-mono text-[11px] text-muted transition-all hover:border-accent hover:text-accent"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(blog.id)}
                  disabled={deleting === blog.id}
                  className="rounded-lg border border-danger/30 px-3 py-1.5 font-mono text-[11px] text-danger transition-all hover:bg-danger/10 disabled:opacity-50"
                >
                  {deleting === blog.id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
