"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.remove("dark", "light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const icons: Record<Theme, string> = { system: "💻", light: "☀️", dark: "🌙" };
  const next: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };

  return (
    <button
      onClick={() => setTheme((t) => next[t])}
      className="text-gray-500 hover:text-gray-900 text-sm px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
      title={`Giao diện: ${theme}`}
    >
      {icons[theme]}
    </button>
  );
}
