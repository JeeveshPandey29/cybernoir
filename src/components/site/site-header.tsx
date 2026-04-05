import Image from "next/image";
import Link from "next/link";
import { NavSearch } from "@/components/site/nav-search";
import { AuthControls } from "@/components/site/auth-controls";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/db";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unreadNotifications = user ? await getUnreadNotificationCount(user.id) : 0;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-accent/20 bg-accent/10">
              <Image src="/images/logo.jpg" alt="CYBERNOIR logo" fill unoptimized className="object-cover" />
            </span>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-foreground">CYBER</span>
              <span className="text-accent">NOIR</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            <Link href="/blogs" className="font-mono text-sm text-muted transition-colors hover:text-foreground">
              Blogs
            </Link>
            {user ? (
              <>
                <Link href="/likes" className="font-mono text-sm text-muted transition-colors hover:text-foreground">
                  Likes
                </Link>
                <Link href="/bookmarks" className="font-mono text-sm text-muted transition-colors hover:text-foreground">
                  Bookmarks
                </Link>
                <Link href="/notifications" className="font-mono text-sm text-muted transition-colors hover:text-foreground">
                  Notifications{unreadNotifications > 0 ? ` (${unreadNotifications})` : ""}
                </Link>
              </>
            ) : null}
            {user?.role === "ADMIN" ? (
              <Link href="/admin" className="font-mono text-sm text-muted transition-colors hover:text-foreground">
                Admin
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden md:block">
            <NavSearch />
          </div>
          <AuthControls
            user={
              user
                ? {
                    username: user.username,
                    role: user.role,
                    avatar: user.avatar,
                    unreadNotifications,
                  }
                : null
            }
          />
        </div>
      </div>
    </header>
  );
}
