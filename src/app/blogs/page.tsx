import Image from "next/image";
import Link from "next/link";
import { getPublishedBlogs } from "@/lib/db";
import { formatCalendarDate } from "@/lib/time";
import { NewsletterSignup } from "@/components/site/newsletter-signup";

export const metadata = {
  title: "Blogs",
  description: "All published articles on CYBERNOIR",
};

export default async function BlogsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; tab?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const query = (params.q ?? "").trim().toLowerCase();
  const tab = params.tab === "liked" || params.tab === "bookmarked" ? params.tab : "latest";
  const blogs = await getPublishedBlogs();
  const filtered = query
    ? blogs.filter((blog) =>
        [blog.title, blog.excerpt, blog.slug, ...blog.tags].join(" ").toLowerCase().includes(query)
      )
    : blogs;

  const sorted = [...filtered].sort((a, b) => {
    if (tab === "liked") {
      return b._count.likes - a._count.likes || new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime();
    }
    if (tab === "bookmarked") {
      return b._count.bookmarks - a._count.bookmarks || new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime();
    }
    return new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime();
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Published Blogs</h1>
        <p className="mt-3 text-muted">Read the latest public write-ups, deep dives, and cloud security notes.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/blogs?tab=latest" className={`rounded-full border px-4 py-2 font-mono text-xs ${tab === "latest" ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"}`}>
            Latest
          </Link>
          <Link href="/blogs?tab=liked" className={`rounded-full border px-4 py-2 font-mono text-xs ${tab === "liked" ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"}`}>
            Most liked
          </Link>
          <Link href="/blogs?tab=bookmarked" className={`rounded-full border px-4 py-2 font-mono text-xs ${tab === "bookmarked" ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"}`}>
            Most bookmarked
          </Link>
        </div>
        {query ? <p className="mt-4 font-mono text-sm text-muted">{sorted.length} results for &quot;{query}&quot;</p> : null}
      </div>

      {sorted.length === 0 ? (
        <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-border py-20 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,212,255,0.12),_transparent_50%)]" />
          <div className="relative flex flex-col items-center justify-center">
            <span className="mb-4 rounded-[1.5rem] border border-accent/20 bg-accent/10 px-5 py-4 font-mono text-accent animate-pulse-glow">EMPTY</span>
            <h2 className="text-xl font-semibold text-foreground">No blog posts yet</h2>
            <p className="mt-2 max-w-md text-muted">
              {query ? "No published posts match that search yet. Try another keyword." : "Published blog posts will appear here once they go live from the admin panel."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {sorted.map((blog) => (
            <Link key={blog.id} href={`/blogs/${blog.slug}`} className="glass-card overflow-hidden transition-transform hover:-translate-y-1">
              {blog.coverImage ? (
                <div className="relative h-52 w-full overflow-hidden border-b border-border">
                  <Image src={blog.coverImage} alt={blog.title} fill unoptimized className="object-cover transition-transform duration-500 hover:scale-105" />
                </div>
              ) : (
                <div className="flex h-52 w-full items-center justify-center border-b border-border bg-[radial-gradient(circle_at_top,_rgba(0,212,255,0.18),_transparent_55%),linear-gradient(135deg,_rgba(18,18,26,1),_rgba(10,10,15,1))]">
                  <span className="font-mono text-sm uppercase tracking-[0.3em] text-accent">CYBERNOIR</span>
                </div>
              )}
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag) => (
                    <span key={tag} className="badge font-mono text-[10px]">{tag}</span>
                  ))}
                </div>
                <h2 className="mt-4 text-2xl font-bold text-foreground">{blog.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{blog.excerpt}</p>
                <div className="mt-6 flex flex-wrap items-center gap-4 font-mono text-xs text-muted">
                  <span>{blog.readingTimeMinutes} min read</span>
                  <span>{formatCalendarDate(blog.publishedAt ?? blog.createdAt)}</span>
                  <span>{blog._count.comments} comments</span>
                  <span>{blog._count.likes} likes</span>
                  <span>{blog._count.bookmarks} bookmarks</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-16">
        <NewsletterSignup />
      </div>
    </main>
  );
}

