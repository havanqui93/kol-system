"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLink {
  href: string;
  label: string;
}

export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng menu" : "Mở menu"}
        aria-expanded={open}
        className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <span className={`block w-5 h-0.5 bg-gray-700 transition-transform ${open ? "rotate-45 translate-y-2" : ""}`} />
        <span className={`block w-5 h-0.5 bg-gray-700 transition-opacity ${open ? "opacity-0" : ""}`} />
        <span className={`block w-5 h-0.5 bg-gray-700 transition-transform ${open ? "-rotate-45 -translate-y-2" : ""}`} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-20 bg-black/20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <nav
            className="absolute top-14 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-lg px-4 py-3 flex flex-col gap-1"
            role="menu"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href))
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin/workers"
              role="menuitem"
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith("/admin") ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Trạng thái Worker
            </Link>
            <div className="mt-1 pt-2 border-t border-gray-100 grid grid-cols-2 gap-1.5">
              <Link
                href="/products/new"
                role="menuitem"
                className="px-3 py-2 rounded-lg text-sm font-medium text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                + Sản phẩm
              </Link>
              <Link
                href="/kol-profiles/new"
                role="menuitem"
                className="px-3 py-2 rounded-lg text-sm font-medium text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                + KOL Profile
              </Link>
            </div>
            <Link
              href="/projects/new"
              role="menuitem"
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-center bg-brand-600 text-white hover:bg-brand-700 transition-colors"
            >
              + Tạo video mới
            </Link>
          </nav>
        </>
      )}
    </div>
  );
}
