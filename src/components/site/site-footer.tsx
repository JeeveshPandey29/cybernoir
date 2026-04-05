export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="font-mono text-sm text-foreground">
            <span className="font-bold">CYBER</span>
            <span className="text-accent">NOIR</span>
          </p>
          <p className="mt-1 max-w-md text-sm text-muted">
            Independent cybersecurity research &amp; technical blog.
          </p>
        </div>

        <p className="font-mono text-xs text-muted-foreground sm:text-right">
          © {year} CYBERNOIR
        </p>
      </div>
    </footer>
  );
}
