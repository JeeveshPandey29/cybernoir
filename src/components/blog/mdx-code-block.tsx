"use client";

import {
  useRef,
  useState,
  useCallback,
  type ComponentProps,
  type ReactNode,
} from "react";

type PreProps = ComponentProps<"pre"> & { children?: ReactNode };

/**
 * Wraps MDX/rehype `<pre>` output: copies inner `code` text to the clipboard.
 * Button stays keyboard-focusable; hover reveals copy on desktop.
 */
export function MdxCodeBlock({ children, className, ...props }: PreProps) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    const codeEl = ref.current?.querySelector("code");
    const text = codeEl?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard API blocked or denied */
    }
  }, []);

  return (
    <div className="group relative my-6">
      <button
        type="button"
        onClick={copy}
        className="absolute right-3 top-3 z-10 rounded-md border border-border bg-surface px-2 py-1 font-mono text-xs text-foreground opacity-0 transition-opacity hover:bg-surface-raised focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-foreground/30 group-hover:opacity-100"
        aria-label={copied ? "Copied" : "Copy code to clipboard"}
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre
        ref={ref}
        {...props}
        className={`${className ?? ""} p-4 pt-12 text-sm leading-relaxed`}
      >
        {children}
      </pre>
    </div>
  );
}
