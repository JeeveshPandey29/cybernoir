import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAuditLogs } from "@/lib/db";

export default async function AdminLogsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const logs = await getAuditLogs(150);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="mt-1 text-sm text-muted">Supabase-backed security events for signups, logins, admin access, and profile changes.</p>
      </div>

      {logs.length === 0 ? (
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm text-muted">No audit logs found yet. If you just enabled this, create the <span className="font-mono">audit_logs</span> table in Supabase first.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-mono text-xs text-muted">TIME</th>
                  <th className="px-4 py-3 font-mono text-xs text-muted">ACTION</th>
                  <th className="px-4 py-3 font-mono text-xs text-muted">STATUS</th>
                  <th className="px-4 py-3 font-mono text-xs text-muted">ACTOR</th>
                  <th className="px-4 py-3 font-mono text-xs text-muted">IP</th>
                  <th className="px-4 py-3 font-mono text-xs text-muted">ROUTE</th>
                  <th className="px-4 py-3 font-mono text-xs text-muted">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="align-top hover:bg-surface-raised/40">
                    <td className="px-4 py-3 font-mono text-xs text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{log.action}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] ${log.status === "SUCCESS" ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger"}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{log.actorEmail || log.actorUserId || "-"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{log.ipAddress || "-"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{log.route || "-"}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted">
                      <pre className="max-w-[360px] whitespace-pre-wrap break-words">{JSON.stringify(log.metadata, null, 2)}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
