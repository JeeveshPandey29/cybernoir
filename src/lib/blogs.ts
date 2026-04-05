import fs from "fs";
import path from "path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";
import type { BlogFrontmatter, BlogMeta, TocItem } from "@/types/blog";

/** Local markdown / MDX posts (git-tracked; ideal for Vercel & Amplify). */
const BLOGS_DIR = path.join(process.cwd(), "content", "blogs");

const EXTENSIONS = [".md", ".mdx"] as const;

function readDirSafe(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir);
}

function slugFromFilename(file: string): string | null {
  const ext = EXTENSIONS.find((e) => file.endsWith(e));
  if (!ext) return null;
  return file.slice(0, -ext.length);
}

/** ~200 words per minute for technical prose */
function estimateReadingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Extract ## / ### headings from raw markdown/MDX body.
 * Uses the same slug algorithm as rehype-slug (github-slugger) for anchor alignment.
 */
export function extractTocFromSource(source: string): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  const lines = source.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    const match = /^(#{2,3})\s+(.+)$/.exec(trimmed);
    if (!match) continue;
    const level = match[1].length as 2 | 3;
    if (level !== 2 && level !== 3) continue;
    const text = match[2].replace(/\s+#+\s*$/, "").trim();
    if (!text) continue;
    const id = slugger.slug(text);
    items.push({ level, text, id });
  }
  return items;
}

function parseFrontmatter(data: Record<string, unknown>): BlogFrontmatter {
  const title = String(data.title ?? "");
  const date = String(data.date ?? "");
  const excerpt = String(data.excerpt ?? "");
  const tags = Array.isArray(data.tags)
    ? data.tags.map(String)
    : typeof data.tags === "string"
      ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
  const readingTime =
    typeof data.readingTime === "number"
      ? data.readingTime
      : data.readingTime != null
        ? Number(data.readingTime)
        : undefined;

  return {
    title,
    date,
    tags,
    excerpt,
    ...(Number.isFinite(readingTime) && readingTime! > 0
      ? { readingTime: readingTime! }
      : {}),
  };
}

/** All slugs for `generateStaticParams` (static generation on Vercel/Amplify). */
export function getBlogSlugs(): string[] {
  return readDirSafe(BLOGS_DIR)
    .map(slugFromFilename)
    .filter((s): s is string => s != null);
}

export function getBlogBySlug(slug: string): {
  meta: BlogMeta;
  content: string;
  toc: TocItem[];
} | null {
  const fileBase = path.join(BLOGS_DIR, slug);
  const filePath =
    EXTENSIONS.map((ext) => fileBase + ext).find((p) => fs.existsSync(p)) ??
    null;

  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const fm = parseFrontmatter(data as Record<string, unknown>);

  const readingTimeMinutes =
    fm.readingTime && fm.readingTime > 0
      ? Math.round(fm.readingTime)
      : estimateReadingMinutes(content);

  const meta: BlogMeta = {
    ...fm,
    slug,
    readingTimeMinutes,
  };

  return {
    meta,
    content,
    toc: extractTocFromSource(content),
  };
}

/** Sorted newest first for index pages. */
export function getAllBlogs(): BlogMeta[] {
  const slugs = getBlogSlugs();
  const posts = slugs
    .map((slug) => getBlogBySlug(slug))
    .filter((p): p is NonNullable<typeof p> => p != null)
    .map((p) => p.meta);

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}
