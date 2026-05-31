"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Sản phẩm" },
  { href: "/kol-profiles", label: "KOL Profiles" },
  { href: "/schedule", label: "Lịch đăng" },
  { href: "/assets", label: "Assets" },
  { href: "/admin/queues", label: "Queues" },
  { href: "/admin/costs", label: "Chi phí" },
  { href: "/docs", label: "API Docs" },
  { href: "/settings", label: "Cài đặt" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
        aria-label={open ? "Đóng menu" : "Mở menu"}
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 px-4 py-3">
          <div className="space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/projects/new"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-brand-600 hover:bg-brand-50"
            >
              + Tạo video mới
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
