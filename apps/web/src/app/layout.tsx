import type { Metadata } from "next";
import Link from "next/link";
import { ToastProvider } from "@/components/ui/toast";
import { MobileNav } from "@/components/ui/mobile-nav";
import { ShortcutsHelp } from "@/components/ui/shortcuts-help";
import "./globals.css";

export const metadata: Metadata = {
  title: "KOL System — AI Video Generator",
  description: "Tạo video KOL tự động bằng AI cho TikTok, Facebook Reels, YouTube Shorts",
};

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/kol-profiles", label: "KOL Profiles" },
  { href: "/products", label: "Sản phẩm" },
  { href: "/settings", label: "Cài đặt" },
  { href: "/admin/workers", label: "Workers" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg text-brand-600">
                <span className="text-2xl">🎬</span>
                KOL System
              </Link>

              {/* Desktop nav */}
              <nav className="hidden sm:flex items-center gap-6 text-sm">
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className="text-gray-600 hover:text-gray-900 transition-colors">
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/projects/new"
                  className="bg-brand-600 text-white px-4 py-1.5 rounded-full hover:bg-brand-700 transition-colors font-medium"
                >
                  + Tạo video mới
                </Link>
              </nav>

              {/* Mobile nav */}
              <MobileNav links={NAV_LINKS} />
            </div>
          </header>

          <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
            <ToastProvider>
              {children}
              <ShortcutsHelp />
            </ToastProvider>
          </main>

          <footer className="border-t border-gray-200 text-center text-xs text-gray-400 py-4">
            KOL System · Powered by Claude + Kling + ElevenLabs
          </footer>
        </div>
      </body>
    </html>
  );
}
