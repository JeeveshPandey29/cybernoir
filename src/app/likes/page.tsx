import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLikedBlogs } from "@/lib/db";

export const metadata = {
  title: "Liked Posts",
  description: "Posts you have liked on CYBERNOIR",
};

export default async function LikesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const blogs = await getLikedBlogs(user.id);

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Your library</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">Liked posts</h1>
        <p className="mt-2 text-sm text-muted">Everything you have reacted to lives here.</p>
      </div>

      {blogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-mono text-sm text-muted">You have not liked any posts yet.</p>
          <Link href="/blogs" className="mt-4 inline-block btn-primary font-mono text-xs">
            Explore blogs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {blogs.map((blog) => (
            <Link key={blog.id} href={`/blogs/${blog.slug}`} className="glass-card p-6 hover:-translate-y-1 transition-transform">
              <div className="flex flex-wrap gap-2">
                {blog.tags.map((tag) => (
                  <span key={tag} className="badge font-mono text-[10px]">{tag}</span>
                ))}
              </div>
              <h2 className="mt-4 text-2xl font-bold text-foreground">{blog.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{blog.excerpt}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
