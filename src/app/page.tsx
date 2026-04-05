import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getLatestPublishedBlogs } from "@/lib/db";
import { RelativeTime } from "@/components/shared/relative-time";
import { NewsletterSignup } from "@/components/site/newsletter-signup";

export default async function HomePage() {
  const [user, latestBlogs] = await Promise.all([getCurrentUser(), getLatestPublishedBlogs(4)]);

  return (
    <main className="hero-gradient">
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6 h-14 w-14 overflow-hidden rounded-2xl border border-accent/20 bg-accent/10 animate-pulse-glow sm:mb-8 sm:h-16 sm:w-16">
            <Image src="/images/logo.jpg" alt="CYBERNOIR logo" fill unoptimized className="object-cover" />
          </div>
          <h1 className="max-w-[12ch] text-4xl font-bold tracking-tight text-foreground sm:max-w-none sm:text-5xl lg:text-6xl">
            Welcome to <span className="text-accent">CYBERNOIR</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-muted sm:mt-6 sm:max-w-3xl sm:text-lg">
            A cybersecurity research blog with practical write-ups, defensive insights, hands-on cloud security notes, and reader discussion around every published post.
          </p>
          <div className="mt-8 flex w-full max-w-sm flex-col justify-center gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:flex-wrap sm:gap-4">
            <Link href="/blogs" className="btn-primary text-center font-mono text-sm">{user ? "Continue Reading" : "Explore Blogs"}</Link>
            {!user ? (
              <Link href="/signup" className="btn-outline text-center font-mono text-sm">Join the Community</Link>
            ) : user.role === "ADMIN" ? (
              <Link href="/admin" className="rounded-lg border border-border px-4 py-2 text-center font-mono text-sm text-muted transition-colors hover:border-border-hover hover:text-foreground">Open Admin</Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Latest Blogs</h2>
              <p className="mt-2 text-sm text-muted">Freshly published write-ups and research articles.</p>
            </div>
            <Link href="/blogs" className="font-mono text-sm text-accent transition-colors hover:text-foreground">View all</Link>
          </div>

          {latestBlogs.length === 0 ? (
            <div className="relative mt-12 overflow-hidden rounded-3xl border border-dashed border-border py-20 text-center">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,212,255,0.12),_transparent_50%)]" />
              <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-accent/20 bg-accent/10 font-mono text-xl text-accent animate-pulse-glow">Blog</div>
              <p className="font-mono text-sm text-muted">No published posts yet.</p>
              <p className="mt-2 text-xs text-muted-foreground">Publish a post from the admin panel to see it here.</p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-12 md:grid-cols-2">
              {latestBlogs.map((blog) => (
                <Link key={blog.id} href={`/blogs/${blog.slug}`} className="glass-card group p-5 transition-transform hover:-translate-y-1 sm:p-6">
                  <h3 className="text-2xl font-semibold leading-tight text-foreground group-hover:text-accent sm:text-xl">{blog.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{blog.excerpt}</p>
                  <div className="mt-5 flex items-center justify-between font-mono text-xs text-muted">
                    <span>{blog.readingTimeMinutes} min read</span>
                    <span><RelativeTime value={blog.publishedAt ?? blog.createdAt} /></span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <NewsletterSignup />
        </div>
      </section>
    </main>
  );
}
