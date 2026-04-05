import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthorProfileByUsername, getPublishedBlogs } from "@/lib/db";
import { RelativeTime } from "@/components/shared/relative-time";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const author = await getAuthorProfileByUsername(username);

  if (!author) {
    return {
      title: "Author Not Found",
      description: "This author profile could not be found.",
    };
  }

  return {
    title: `${author.username} | Author`,
    description: author.bio || `Read articles and public profile details for ${author.username}.`,
  };
}

export default async function AuthorPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const author = await getAuthorProfileByUsername(username);

  if (!author) {
    notFound();
  }

  const blogs = (await getPublishedBlogs()).slice(0, 6);

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-border bg-surface p-6">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border border-accent/25 bg-accent/10">
            {author.avatar ? (
              <Image src={author.avatar} alt={author.username} fill unoptimized className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-mono text-2xl text-accent">
                {author.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <p className="mt-5 font-mono text-xs uppercase tracking-[0.18em] text-muted">Author</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">{author.username}</h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-accent">{author.role}</p>
          <p className="mt-5 text-sm leading-7 text-muted">{author.bio}</p>

          <div className="mt-6 space-y-2">
            {author.websiteUrl ? (
              <a href={author.websiteUrl} target="_blank" rel="noreferrer" className="block rounded-xl border border-border px-4 py-3 text-sm text-muted transition-colors hover:border-border-hover hover:text-foreground">
                Website
              </a>
            ) : null}
            {author.xUrl ? (
              <a href={author.xUrl} target="_blank" rel="noreferrer" className="block rounded-xl border border-border px-4 py-3 text-sm text-muted transition-colors hover:border-border-hover hover:text-foreground">
                X
              </a>
            ) : null}
            {author.linkedinUrl ? (
              <a href={author.linkedinUrl} target="_blank" rel="noreferrer" className="block rounded-xl border border-border px-4 py-3 text-sm text-muted transition-colors hover:border-border-hover hover:text-foreground">
                LinkedIn
              </a>
            ) : null}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-8">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Published work</p>
            <h2 className="mt-3 text-2xl font-bold text-foreground">Latest posts by {author.username}</h2>
            <p className="mt-2 text-sm text-muted">Public articles and security write-ups from this author.</p>
          </div>

          <div className="grid gap-4">
            {blogs.length > 0 ? (
              blogs.map((blog) => (
                <Link key={blog.id} href={`/blogs/${blog.slug}`} className="glass-card block p-5">
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="badge font-mono text-[10px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-foreground">{blog.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{blog.excerpt}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-xs text-muted">
                    <span>
                      <RelativeTime value={blog.publishedAt ?? blog.createdAt} />
                    </span>
                    <span>{blog.readingTimeMinutes} min read</span>
                    <span>{blog._count.likes} likes</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="font-mono text-sm text-muted">No published posts yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
