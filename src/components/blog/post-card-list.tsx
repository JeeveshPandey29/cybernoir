import Link from "next/link";
import type { BlogMeta } from "@/types/blog";

export function PostCardList({ posts }: { posts: BlogMeta[] }) {
  if (posts.length === 0) {
    return (
      <p className="text-muted">
        Nothing here yet. Add a post under{" "}
        <code className="font-mono text-sm">content/blogs</code> with the right
        tags in frontmatter.
      </p>
    );
  }

  return (
    <ul className="space-y-6">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link
            href={`/blogs/${post.slug}`}
            className="block rounded-xl border border-border bg-surface p-6 transition-transform hover:-translate-y-0.5 hover:border-muted-foreground"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted">
              {post.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
              <span className="rounded-full bg-foreground px-2 py-0.5 text-background">
                Article
              </span>
            </div>
            <h2 className="mt-3 text-xl font-bold text-foreground sm:text-2xl">
              {post.title}
            </h2>
            <p className="mt-2 line-clamp-2 text-muted">{post.excerpt}</p>
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              {post.readingTimeMinutes} min read
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
