"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { BlogMeta } from "@/types/blog";
import { PostCardList } from "@/components/blog/post-card-list";

function postMatchesQuery(post: BlogMeta, q: string): boolean {
  if (!q.trim()) return true;
  const needle = q.trim().toLowerCase();
  const hay = [
    post.title,
    post.excerpt,
    ...post.tags,
    post.slug.replace(/-/g, " "),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export function BlogsListing({ posts }: { posts: BlogMeta[] }) {
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  const filtered = useMemo(
    () => posts.filter((p) => postMatchesQuery(p, q)),
    [posts, q],
  );

  if (posts.length === 0) {
    return (
      <p className="text-muted">
        No posts yet. Add a <code className="font-mono">.md</code> or{" "}
        <code className="font-mono">.mdx</code> file under{" "}
        <code className="font-mono">content/blogs</code>.
      </p>
    );
  }

  return (
    <>
      {q.trim() ? (
        <p className="mb-8 font-mono text-sm text-muted">
          {filtered.length} result{filtered.length === 1 ? "" : "s"} for{" "}
          <span className="text-foreground">&ldquo;{q}&rdquo;</span>
        </p>
      ) : null}

      {filtered.length > 0 ? (
        <PostCardList posts={filtered} />
      ) : (
        <p className="text-muted">
          No posts match your search. Try another keyword or{" "}
          <Link href="/blogs" className="text-foreground underline">
            clear the filter
          </Link>
          .
        </p>
      )}
    </>
  );
}
