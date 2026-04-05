/**
 * Frontmatter for each file in /content/blogs.
 * `readingTime` is optional — computed when omitted (words / 200 wpm).
 */
export interface BlogFrontmatter {
  title: string;
  /** ISO date string, e.g. 2026-04-04 */
  date: string;
  tags: string[];
  excerpt: string;
  /** Minutes; overrides auto-calculated reading time when set */
  readingTime?: number;
}

export interface BlogMeta extends BlogFrontmatter {
  slug: string;
  /** Resolved reading time in minutes (integer, min 1) */
  readingTimeMinutes: number;
}

export interface TocItem {
  id: string;
  text: string;
  /** 2 = h2, 3 = h3 — matches common blog TOC depth */
  level: 2 | 3;
}
