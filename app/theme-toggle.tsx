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
      className="group relative rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground transition-all duration-300 hover:bg-background hover:scale-110 hover:shadow-lg hover:shadow-brand/20 dark:hover:bg-background overflow-hidden"
      aria-label="Toggle theme"
    >
      <span className="relative z-10 inline-block transition-transform duration-500 group-hover:rotate-180">
        {theme === "light" || (theme === "system" && !document.documentElement.classList.contains("dark")) ? "🌙" : "☀️"}
      </span>
      <span className="absolute inset-0 bg-gradient-to-r from-brand/10 to-brand-strong/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
    </button>
  );
}
