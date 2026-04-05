"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/site/toast-viewport";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.error || "Invalid credentials";
        setError(message);
        showToast({
          title: "Admin login failed",
          description: message,
          tone: "error",
        });
        setLoading(false);
        return;
      }

      showToast({
        title: "Admin login successful",
        description: "Control center access granted.",
        tone: "success",
      });
      router.push("/admin");
      router.refresh();
    } catch {
      const message = "Something went wrong";
      setError(message);
      showToast({
        title: "Admin login failed",
        description: message,
        tone: "error",
      });
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-danger/5 blur-[120px] animate-pulse-glow" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/5 blur-[120px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="absolute -top-px left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-danger/60 to-transparent" />

        <div className="glass-card p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-danger/10 border border-danger/20">
              <span className="text-2xl">🛡️</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Admin Panel
            </h1>
            <p className="mt-1 text-sm text-muted font-mono">
              CYBERNOIR CONTROL CENTER
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-username" className="mb-1.5 block font-mono text-xs font-medium text-muted">
                USERNAME
              </label>
              <input
                id="admin-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="input-field"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-1.5 block font-mono text-xs font-medium text-muted">
                PASSWORD
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                autoComplete="current-password"
              />
            </div>

            <div>
              <label htmlFor="admin-otp" className="mb-1.5 block font-mono text-xs font-medium text-muted">
                MFA CODE
              </label>
              <input
                id="admin-otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code"
                className="input-field"
                autoComplete="one-time-code"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-danger to-red-700 px-4 py-3 font-mono text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-danger/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              id="admin-login-btn"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating…
                </>
              ) : (
                "Access Admin Panel"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground font-mono">
            Authorized personnel only
          </p>
        </div>

        <div className="absolute -bottom-px left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-danger/30 to-transparent" />
      </div>
    </div>
  );
}
