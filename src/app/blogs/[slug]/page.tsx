import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileBlogMdx } from "@/lib/mdx";
import { extractTocFromSource } from "@/lib/blogs";
import { getCurrentUser } from "@/lib/auth";
import { getBlogReactionState, getRelatedPublishedBlogs, getPublishedBlogBySlug } from "@/lib/db";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { BlogInteractions } from "@/components/blog/blog-interactions";
import { ShareButtons } from "@/components/blog/share-buttons";
import { RelativeTime } from "@/components/shared/relative-time";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublishedBlogBySlug(slug);

  if (!data) {
    return { title: "Blog Not Found", description: "This blog post could not be found." };
  }

  const { blog } = data;
  const description = blog.excerpt;

  return {
    title: blog.title,
    description,
    openGraph: {
      title: blog.title,
      description,
      type: "article",
      url: `/blogs/${blog.slug}`,
      images: blog.coverImage ? [{ url: blog.coverImage }] : undefined,
    },
    twitter: {
      card: blog.coverImage ? "summary_large_image" : "summary",
      title: blog.title,
      description,
      images: blog.coverImage ? [blog.coverImage] : undefined,
    },
  };
}

export default async function BlogSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const data = await getPublishedBlogBySlug(slug, user?.id);

  if (!data) {
    notFound();
  }

  const { blog, comments } = data;
  const relatedBlogs = await getRelatedPublishedBlogs(blog.slug, blog.tags, 3);
  const mdx = await compileBlogMdx(blog.content);
  const toc = extractTocFromSource(blog.content);
  const reactionState = user ? await getBlogReactionState(blog.id, user.id) : { liked: false, bookmarked: false };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
        <article className="min-w-0">
          <Link href="/blogs" className="font-mono text-sm text-accent transition-colors hover:text-foreground">
            {"< Back to blogs"}
          </Link>

          <div className="mt-6">
            {blog.coverImage ? (
              <div className="relative mb-6 h-[220px] overflow-hidden rounded-3xl border border-border sm:mb-8 sm:h-[320px]">
                <Image src={blog.coverImage} alt={blog.title} fill unoptimized className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              </div>
            ) : null}
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{blog.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted sm:text-lg sm:leading-8">{blog.excerpt}</p>
            <div className="mt-5 flex flex-wrap items-center gap-4 font-mono text-xs text-muted">
              <span><RelativeTime value={blog.publishedAt ?? blog.createdAt} /></span>
              <span>{blog.readingTimeMinutes} min read</span>
              <span>{blog._count.comments} comments</span>
            </div>
          </div>

          <div className="mt-10">
            <div className="rounded-3xl border border-border bg-surface p-4 sm:p-8">
              <div className="prose prose-invert mdx-content max-w-none">{mdx.content}</div>
            </div>
          </div>

          <div className="mt-12 border-t border-border pt-8">
            <div className="mb-5 flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <span key={tag} className="badge font-mono text-[10px]">{tag}</span>
              ))}
            </div>
            <h2 className="text-2xl font-semibold text-foreground">Engage with this post</h2>
            <p className="mt-2 text-sm text-muted">Like, bookmark, share, and join the discussion below.</p>
            <div className="mt-6">
              <BlogInteractions blogId={blog.id} initialCounts={blog._count} initialComments={comments} initialState={reactionState} canInteract={Boolean(user)} />
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-surface px-5 py-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Written by</p>
            <Link
              href={`/authors/${encodeURIComponent(blog.author?.username ?? "Jeevesh Pandey")}`}
              className="mt-4 flex items-start gap-4 rounded-xl transition-colors hover:bg-background/30"
            >
              <div className="relative h-14 w-14 overflow-hidden rounded-full border border-accent/25 bg-accent/10">
                {blog.author?.avatar ? (
                  <Image src={blog.author.avatar} alt={blog.author.username} fill unoptimized className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-mono text-base text-accent">{(blog.author?.username ?? "C").charAt(0).toUpperCase()}</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-foreground">{blog.author?.username ?? "Jeevesh Pandey"}</p>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{blog.author?.role ?? "AUTHOR"}</p>
                {blog.author?.bio ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{blog.author.bio}</p> : null}
                <div className="mt-3 flex flex-wrap gap-3 font-mono text-xs text-accent">
                  {blog.author?.websiteUrl ? <span>Website</span> : null}
                  {blog.author?.xUrl ? <span>X</span> : null}
                  {blog.author?.linkedinUrl ? <span>LinkedIn</span> : null}
                </div>
              </div>
            </Link>
          </div>
        </article>

        <aside className="order-first space-y-4 lg:order-none lg:sticky lg:top-24 lg:h-fit">
          <ShareButtons title={blog.title} />
          <div className="rounded-xl border border-border bg-surface p-4 text-sm">
            <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted">Reader access</p>
            <p className="leading-6 text-muted">
              {user ? "You are signed in and can like, bookmark, reply, and comment on this article." : "Login or sign up to like, bookmark, reply, and comment on this article."}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-sm">
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted">Related posts</p>
            {relatedBlogs.length > 0 ? (
              <div className="space-y-3">
                {relatedBlogs.map((item) => (
                  <Link key={item.id} href={`/blogs/${item.slug}`} className="block rounded-lg border border-border bg-background/30 px-3 py-3 transition-colors hover:border-border-hover">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{item.excerpt}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="leading-6 text-muted">More related posts will appear as the library grows.</p>
            )}
          </div>
          <div className="hidden lg:block">
            <TableOfContents items={toc} />
          </div>
        </aside>
      </div>
    </main>
  );
}
