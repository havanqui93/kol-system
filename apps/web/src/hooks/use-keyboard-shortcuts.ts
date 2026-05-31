"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Don't fire shortcuts when typing in inputs/textareas
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement).isContentEditable) return;

      switch (e.key) {
        case "n":
        case "N":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            router.push("/projects/new");
          }
          break;
        case "/":
          e.preventDefault();
          // Focus the search input if on dashboard
          const searchInput = document.querySelector<HTMLInputElement>('input[type="search"]');
          searchInput?.focus();
          break;
        case "?":
          // Could open a help modal — for now just log
          break;
        case "Escape":
          // Blur any focused element
          (document.activeElement as HTMLElement)?.blur();
          break;
      }
    }

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [router]);
}
