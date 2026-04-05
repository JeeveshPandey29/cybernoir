"use client";

import { useEffect, useMemo, useState } from "react";

type ToastTone = "success" | "error" | "info";

type ToastPayload = {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
};

type ToastItem = ToastPayload & {
  id: string;
  duration: number;
};

const EVENT_NAME = "cybernoir:toast";
const STORAGE_KEY = "cybernoir:pending-toast";

export function showToast(payload: ToastPayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
}

export function persistToastForNextPage(payload: ToastPayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function ToastViewport() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function pushToast(payload: ToastPayload) {
      const next: ToastItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: payload.title,
        description: payload.description,
        tone: payload.tone ?? "success",
        duration: payload.duration ?? 5000,
      };

      setToasts((current) => [...current, next]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== next.id));
      }, next.duration);
    }

    function handleToast(event: Event) {
      const customEvent = event as CustomEvent<ToastPayload>;
      pushToast(customEvent.detail);
    }

    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      try {
        pushToast(JSON.parse(stored) as ToastPayload);
      } catch {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    }

    window.addEventListener(EVENT_NAME, handleToast as EventListener);
    return () => window.removeEventListener(EVENT_NAME, handleToast as EventListener);
  }, []);

  const toneClasses = useMemo(
    () => ({
      success: "border-accent/30 bg-surface text-foreground",
      error: "border-danger/30 bg-surface text-foreground",
      info: "border-border-hover bg-surface text-foreground",
    }),
    []
  );

  const barClasses = useMemo(
    () => ({
      success: "bg-accent",
      error: "bg-danger",
      info: "bg-border-hover",
    }),
    []
  );

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
      {toasts.map((toast) => (
        <div key={toast.id} className={`pointer-events-auto overflow-hidden rounded-2xl border shadow-2xl shadow-black/25 ${toneClasses[toast.tone ?? "success"]}`}>
          <div className="p-4">
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.description ? <p className="mt-1 text-sm text-muted">{toast.description}</p> : null}
          </div>
          <div className="h-1 w-full bg-background/40">
            <div
              className={`h-full origin-left animate-toast-progress ${barClasses[toast.tone ?? "success"]}`}
              style={{ animationDuration: `${toast.duration}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
