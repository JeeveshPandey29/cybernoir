import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import type { MDXComponents } from "mdx/types";
import { MdxCodeBlock } from "@/components/blog/mdx-code-block";

/**
 * Shiki via rehype-pretty-code — use a bundled theme (required for RSC/MDX compile).
 * Visual treatment is monochrome via `filter` on `.mdx-content pre` in globals.css.
 */
const prettyCodeOptions = {
  theme: "github-dark",
  keepBackground: true,
  defaultLang: "plaintext",
} as const;

function getMdxComponents(): MDXComponents {
  return {
    /** Wrap fenced blocks: rehype-pretty-code outputs <pre><code>...</code></pre> */
    pre: ({ children, ...props }) => (
      <MdxCodeBlock {...props}>{children}</MdxCodeBlock>
    ),
  };
}

export type MdxCompileResult = Awaited<ReturnType<typeof compileBlogMdx>>;

/**
 * Server-only: compiles MDX source to a React tree for App Router RSC pages.
 */
export async function compileBlogMdx(source: string) {
  return compileMDX({
    source,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypePrettyCode, prettyCodeOptions],
        ],
      },
    },
    components: getMdxComponents(),
  });
}
