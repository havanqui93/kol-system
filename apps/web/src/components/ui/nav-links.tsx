"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface NavLink {
  href: string;
  label: string;
}

interface Counts {
  scriptReady: number;
  failed: number;
}

export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<Counts>({ scriptReady: 0, failed: 0 });

  useEffect(() => {
    async function fetchCounts() {
      try {
        const r = await fetch("/api/stats", { headers: { "x-user-id": "demo-user" } });
        if (r.ok) setCounts(await r.json());
      } catch {}
    }
    fetchCounts();
    const id = setInterval(fetchCounts, 30_000);
    return () => clearInterval(id);
  }, []);

  const total = counts.scriptReady + counts.failed;

  return (
    <>
      {links.map((link) => {
        const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        const showBadge = link.href === "/" && total > 0;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative text-sm transition-colors ${
              isActive ? "text-brand-600 font-semibold" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {link.label}
            {showBadge && (
              <span className="absolute -top-1.5 -right-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5 leading-none">
                {total > 9 ? "9+" : total}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}
