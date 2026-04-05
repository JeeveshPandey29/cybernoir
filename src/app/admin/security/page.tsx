import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { buildAdminTotpUri, isAdminMfaEnabled } from "@/lib/totp";

export default async function AdminSecurityPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const otpauthUrl = buildAdminTotpUri();
  const mfaEnabled = isAdminMfaEnabled();
  const secret = process.env.ADMIN_TOTP_SECRET ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Security</h1>
        <p className="mt-1 text-sm text-muted">Manage admin MFA and review protected access setup.</p>
      </div>

      <section className="glass-card space-y-4 p-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Admin MFA</p>
          <h2 className="mt-2 text-lg font-semibold text-foreground">
            {mfaEnabled ? "Two-factor verification is active" : "Two-factor verification is not configured yet"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            Add the setup key to Google Authenticator, Authy, or Microsoft Authenticator using a Time-based account.
          </p>
        </div>

        {mfaEnabled ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface-raised/60 p-4">
              <p className="font-mono text-xs text-muted">SETUP KEY</p>
              <p className="mt-2 break-all font-mono text-sm text-foreground">{secret}</p>
            </div>

            <div className="rounded-2xl border border-border bg-surface-raised/60 p-4">
              <p className="font-mono text-xs text-muted">OTPAUTH URL</p>
              <p className="mt-2 break-all font-mono text-xs text-foreground">{otpauthUrl}</p>
            </div>

            <ol className="space-y-2 text-sm text-muted">
              <li>1. Open Google Authenticator and tap the <span className="text-foreground">+</span> button.</li>
              <li>2. Choose <span className="text-foreground">Enter a setup key</span>.</li>
              <li>3. Use <span className="text-foreground">CyberNoir Admin</span> as the account name.</li>
              <li>4. Paste the setup key above and keep it <span className="text-foreground">Time based</span>.</li>
              <li>5. Use the 6-digit code from the app when logging into the admin panel.</li>
            </ol>
          </div>
        ) : (
          <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
            Add <span className="font-mono">ADMIN_TOTP_SECRET</span> to your <span className="font-mono">.env</span>, restart the app, and this page will generate your setup URI automatically.
          </div>
        )}
      </section>

      <section className="glass-card space-y-3 p-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Audit Trail</p>
        <h2 className="text-lg font-semibold text-foreground">Review security events</h2>
        <p className="text-sm text-muted">Login failures, profile changes, and admin access events are visible from the audit log panel.</p>
        <Link href="/admin/logs" className="btn-outline inline-flex font-mono text-xs">
          Open audit logs
        </Link>
      </section>
    </div>
  );
}
