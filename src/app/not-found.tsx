import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-5xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">404 signal lost</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            This page slipped into the dark.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
            The route you tried to open does not exist, was removed, or never made it out of draft.
            Let’s get you back to something useful.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="btn-primary font-mono text-sm">
              Return home
            </Link>
            <Link href="/blogs" className="btn-outline font-mono text-sm">
              Browse blogs
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-surface p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,212,255,0.14),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(0,212,255,0.08),_transparent_35%)]" />
          <div className="relative flex h-full min-h-[320px] flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-[1.75rem] border border-accent/20 bg-accent/10 font-mono text-4xl text-accent animate-pulse-glow">
              404
            </div>
            <p className="font-mono text-sm uppercase tracking-[0.24em] text-muted">Page not found</p>
            <div className="mt-6 w-full max-w-xs rounded-2xl border border-border bg-background/60 p-4 text-left">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Status</p>
              <p className="mt-2 text-sm text-foreground">No route matched the requested resource.</p>
              <p className="mt-3 text-xs leading-6 text-muted">Try navigating from the homepage or the published blog index.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
