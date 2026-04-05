"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: "DB" },
  { href: "/admin/blogs", label: "Blogs", icon: "BL" },
  { href: "/admin/users", label: "Users", icon: "US" },
  { href: "/admin/newsletter", label: "Newsletter", icon: "NL" },
  { href: "/admin/author", label: "Author", icon: "AU" },
  { href: "/admin/security", label: "Security", icon: "SC" },
  { href: "/admin/logs", label: "Logs", icon: "LG" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoginPage) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isLoginPage]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  if (isLoginPage) {
    return <div className="fixed inset-0 z-[100] overflow-auto bg-background">{children}</div>;
  }

  const currentLabel =
    sidebarLinks.find((link) => (link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href)))
      ?.label || "Admin";

  return (
    <div className="fixed inset-0 z-[100] flex bg-background">
      {sidebarOpen ? (
        <div className="fixed inset-0 z-[101] bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-[102] flex h-full w-64 flex-col border-r border-border bg-surface transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 font-mono text-sm text-accent">
              CN
            </span>
            <div>
              <span className="text-sm font-bold tracking-tight text-foreground">
                CYBER<span className="text-accent">NOIR</span>
              </span>
              <span className="ml-2 badge badge-accent py-0 text-[10px]">ADMIN</span>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="text-muted hover:text-foreground lg:hidden">
            X
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-auto px-3 py-4">
          {sidebarLinks.map((link) => {
            const isActive = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 font-mono text-sm transition-all ${
                  isActive
                    ? "border-accent/20 bg-accent/10 text-accent"
                    : "border-transparent text-muted hover:bg-surface-raised hover:text-foreground"
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-current/15 bg-background/40 text-[10px]">
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-border p-4">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 font-mono text-xs text-muted transition-all hover:bg-surface-raised hover:text-foreground">
            <span className="text-base">[]</span>
            View Site
          </Link>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 font-mono text-xs text-danger transition-all hover:bg-danger/10">
            <span className="text-base">{"->"}</span>
            Logout
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border bg-surface/50 px-4 py-3 backdrop-blur-sm sm:px-6">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg border border-border p-2 text-muted hover:text-foreground lg:hidden">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="hidden lg:block">
            <h2 className="font-mono text-sm text-muted">{currentLabel}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-sm text-accent">
              A
            </span>
            <span className="hidden font-mono text-xs text-muted sm:block">Admin</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
