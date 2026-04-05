import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About CYBERNOIR — a cybersecurity research blog.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">
        About <span className="text-accent">CYBERNOIR</span>
      </h1>
      <p className="mt-6 text-muted leading-relaxed">
        CYBERNOIR is a cybersecurity research blog covering cloud security,
        offensive techniques, defensive hardening, and technical deep dives.
        It&apos;s built as a full-stack platform where readers can sign up,
        engage with content, and be part of the community.
      </p>

      <h2
        id="stack"
        className="mt-14 scroll-mt-28 text-xl font-semibold text-foreground"
      >
        Tech Stack
      </h2>
      <ul className="mt-4 list-inside list-disc space-y-2 text-muted marker:text-accent/50">
        <li>Next.js 15 App Router + Tailwind CSS v4</li>
        <li>Prisma ORM + SQLite database</li>
        <li>NextAuth.js for authentication (credentials + OAuth)</li>
        <li>TypeScript end-to-end</li>
      </ul>

      <h2 className="mt-14 text-xl font-semibold text-foreground">
        Features
      </h2>
      <ul className="mt-4 list-inside list-disc space-y-2 text-muted marker:text-accent/50">
        <li>User signup, login, and profile management</li>
        <li>Like, comment, and bookmark blog posts</li>
        <li>Admin panel for content management</li>
        <li>Image upload support for blog covers</li>
      </ul>
    </div>
  );
}
