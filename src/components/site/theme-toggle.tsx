"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem("cybernoir-theme") || "dark";
    setTheme(stored);
    document.documentElement.dataset.theme = stored;
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("cybernoir-theme", next);
    document.documentElement.dataset.theme = next;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-xl border border-border bg-surface px-3 py-2 font-mono text-xs text-muted transition-colors hover:border-border-hover hover:text-foreground"
    >
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
