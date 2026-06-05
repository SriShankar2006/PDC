"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme("system");
    }
  }, []);

  function applyTheme(newTheme: "light" | "dark" | "system") {
    const html = document.documentElement;
    if (newTheme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      html.classList.toggle("dark", isDark);
    } else {
      html.classList.toggle("dark", newTheme === "dark");
    }
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
  }

  if (!mounted) return null;

  return (
    <button
      onClick={() => {
        const nextTheme = theme === "light" ? "dark" : "light";
        applyTheme(nextTheme);
      }}
      className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition-colors hover:bg-background dark:hover:bg-background"
      aria-label="Toggle theme"
    >
      {theme === "light" || (theme === "system" && !document.documentElement.classList.contains("dark")) ? "🌙" : "☀️"}
    </button>
  );
}
