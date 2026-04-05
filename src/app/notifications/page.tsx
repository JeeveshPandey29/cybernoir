import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getNotificationsForUser } from "@/lib/db";
import { RelativeTime } from "@/components/shared/relative-time";
import { NotificationsActions } from "@/components/site/notifications-actions";

export const metadata = {
  title: "Notifications",
  description: "Replies and new post updates",
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const notifications = await getNotificationsForUser(user.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Inbox</p>
          <h1 className="mt-3 text-3xl font-bold text-foreground">Notifications</h1>
          <p className="mt-2 text-sm text-muted">Track new posts and replies to your discussions.</p>
        </div>
        <NotificationsActions />
      </div>

      {notifications.length === 0 ? (
        <div className="glass-card px-6 py-12 text-center">
          <p className="font-mono text-sm text-muted">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((item) => (
            <div key={item.id} className={`glass-card p-5 ${item.read ? "opacity-80" : "border-accent/30"}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">{item.type.replace(/_/g, " ")}</p>
                  <h2 className="mt-2 text-lg font-semibold text-foreground">{item.title}</h2>
                  <p className="mt-2 text-sm text-muted">{item.body}</p>
                </div>
                <p className="font-mono text-xs text-muted"><RelativeTime value={item.createdAt} /></p>
              </div>
              {item.link ? <Link href={item.link} className="mt-4 inline-block font-mono text-xs text-accent transition-colors hover:text-foreground">Open</Link> : null}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
