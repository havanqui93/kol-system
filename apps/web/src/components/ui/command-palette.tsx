"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/api/client";

const QUICK_LINKS = [
  { id: "home", label: "Dashboard", href: "/", icon: "🏠" },
  { id: "new", label: "Tạo video mới", href: "/projects/new", icon: "🎬" },
  { id: "new-product", label: "Thêm sản phẩm", href: "/products/new", icon: "📦" },
  { id: "new-kol", label: "Tạo KOL Profile", href: "/kol-profiles/new", icon: "🎭" },
  { id: "products", label: "Thư viện sản phẩm", href: "/products", icon: "🏪" },
  { id: "kols", label: "Danh sách KOL", href: "/kol-profiles", icon: "👤" },
  { id: "settings", label: "Cài đặt", href: "/settings", icon: "⚙️" },
];

type Item = { id: string; label: string; sub?: string; href: string; icon: string };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    setTimeout(() => inputRef.current?.focus(), 10);
    fetch("/api/video-projects", { headers: { "x-user-id": "demo-user" } })
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => {});
  }, [open]);

  const projectItems: Item[] = projects
    .filter((p) => !query || (p.title ?? "").toLowerCase().includes(query.toLowerCase()) || (p.product?.name ?? "").toLowerCase().includes(query.toLowerCase()))
    .slice(0, query ? 10 : 5)
    .map((p) => ({
      id: p.id,
      label: p.title ?? `Video #${p.id.slice(-6)}`,
      sub: (p.product?.name ? `${p.product.name} · ` : "") + p.status.replace(/_/g, " "),
      href: `/projects/${p.id}`,
      icon: p.status === "published" ? "✅" : p.status === "failed" ? "❌" : p.status === "script_ready" ? "⏳" : "🎬",
    }));

  const items: Item[] = query
    ? projectItems
    : [
        ...QUICK_LINKS,
        ...(projectItems.length ? projectItems : []),
      ];

  function navigate(href: string) {
    router.push(href);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && items[activeIndex]) {
      navigate(items[activeIndex].href);
    }
  }

  useEffect(() => setActiveIndex(0), [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-[15vh]"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <span className="text-gray-400 text-lg flex-shrink-0">⌕</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Tìm kiếm dự án, trang..."
            className="flex-1 text-sm outline-none placeholder-gray-400"
          />
          <kbd className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">Esc</kbd>
        </div>

        <ul className="py-2 max-h-72 overflow-y-auto">
          {query && items.length === 0 && (
            <li className="px-4 py-8 text-center">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm text-gray-500 font-medium">Không tìm thấy kết quả</p>
              <p className="text-xs text-gray-400 mt-1">Thử tìm tên dự án hoặc sản phẩm</p>
            </li>
          )}
          {!query && (
            <li className="px-4 pt-1 pb-1 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
              Liên kết nhanh
            </li>
          )}
          {items.map((item, i) => (
            <>
              {!query && i === QUICK_LINKS.length && projectItems.length > 0 && (
                <li key={`sep-${i}`} className="px-4 pt-3 pb-1 text-[11px] text-gray-400 font-semibold uppercase tracking-wider border-t border-gray-50 mt-1">
                  Dự án gần đây
                </li>
              )}
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.href)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                    i === activeIndex ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{item.label}</span>
                    {item.sub && <span className="text-xs text-gray-400 truncate block">{item.sub}</span>}
                  </div>
                </button>
              </li>
            </>
          ))}
        </ul>

        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
          <span><kbd className="bg-gray-100 px-1 rounded">↑↓</kbd> điều hướng</span>
          <span><kbd className="bg-gray-100 px-1 rounded">↵</kbd> chọn</span>
          <span className="ml-auto"><kbd className="bg-gray-100 px-1 rounded">Ctrl+K</kbd> đóng</span>
        </div>
      </div>
    </div>
  );
}
