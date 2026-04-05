"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { persistToastForNextPage, showToast } from "@/components/site/toast-viewport";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      const message = "Invalid email or password";
      setError(message);
      showToast({
        title: "Login failed",
        description: message,
        tone: "error",
      });
    } else {
      persistToastForNextPage({
        title: "Login successful",
        description: "Welcome back to CYBERNOIR.",
        tone: "success",
      });
      router.push("/");
      router.refresh();
    }
  }

  async function handleGoogleLogin() {
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      showToast({
        title: "Google login failed",
        description: "Please try again in a moment.",
        tone: "error",
      });
    }
  }

  return (
    <div className="min-h-screen bg-background lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen lg:h-screen lg:grid-cols-[42%_minmax(0,1fr)]">
        <aside className="relative hidden overflow-hidden border-r border-border lg:block">
          <Image
            src="/images/auth-login.jpg"
            alt="Login illustration"
            fill
            unoptimized
            priority
            quality={100}
            sizes="42vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,10,18,0.22),rgba(6,10,18,0.84)),radial-gradient(circle_at_top,rgba(0,212,255,0.16),transparent_45%)]" />
          <div className="absolute inset-0 flex flex-col justify-between p-8">
            <div className="glass-card max-w-sm p-5 backdrop-blur-md">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">Welcome back</p>
              <h2 className="mt-3 text-3xl font-bold text-foreground">Pick up where you left off.</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Return to your saved posts, active discussions, and the latest cybersecurity research updates.
              </p>
            </div>

            <div className="grid gap-3">
              {[
                "Review saved blogs and bookmarks",
                "Track new comments and notifications",
                "Jump back into active community threads",
              ].map((item) => (
                <div key={item} className="glass-card max-w-md p-4 backdrop-blur-md">
                  <p className="text-sm text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-6 py-6 sm:px-8 lg:px-10 lg:py-4">
          <div className="w-full max-w-xl lg:max-w-lg">
            <Link href="/" className="mb-4 inline-flex items-center gap-3 transition-opacity hover:opacity-85">
              <span className="relative h-11 w-11 overflow-hidden rounded-xl border border-accent/20 bg-accent/10">
                <Image src="/images/logo.jpg" alt="CYBERNOIR logo" fill unoptimized className="object-cover" />
              </span>
              <span className="text-xl font-bold tracking-tight text-foreground">
                CYBER<span className="text-accent">NOIR</span>
              </span>
            </Link>

            <div className="max-w-lg">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">Sign in</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground lg:text-[2.35rem]">Access your CYBERNOIR account</h1>
              <p className="mt-2 text-sm leading-6 text-muted sm:text-base">
                Continue reading, manage your profile, and jump into the latest discussions without missing context.
              </p>
            </div>

            <div className="mt-5 rounded-[2rem] border border-border bg-surface p-5 shadow-2xl shadow-black/15 sm:p-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface-raised px-4 py-3 font-mono text-sm text-foreground transition-all hover:border-border-hover hover:bg-surface-raised/80 active:scale-[0.99]"
                id="google-login-btn"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              <div className="relative my-4 flex items-center">
                <div className="flex-1 border-t border-border" />
                <span className="mx-4 font-mono text-xs text-muted-foreground">OR</span>
                <div className="flex-1 border-t border-border" />
              </div>

              <form onSubmit={handleCredentialsLogin} className="space-y-3.5">
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block font-mono text-xs font-medium text-muted">
                    EMAIL
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="mb-1.5 block font-mono text-xs font-medium text-muted">
                    PASSWORD
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-field"
                    autoComplete="current-password"
                  />
                </div>

                {error ? (
                  <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex w-full items-center justify-center gap-2 font-mono text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  id="login-submit-btn"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <p className="mt-3 text-center text-sm text-muted">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-medium text-accent transition-colors hover:text-foreground">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
