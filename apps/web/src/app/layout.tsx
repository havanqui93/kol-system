import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { KeyboardShortcutsProvider } from "@/components/ui/keyboard-shortcuts-provider";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { ProcessingBadge } from "@/components/ui/processing-badge";
import { RouteProgress } from "@/components/ui/route-progress";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MobileNav } from "@/components/ui/mobile-nav";
import { NotificationBell } from "@/components/ui/notification-bell";
import { DemoBanner } from "@/components/ui/demo-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: "KOL System — AI Video Generator",
  description: "Tạo video KOL tự động bằng AI cho TikTok, Facebook Reels, YouTube Shorts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <ToastProvider>
        <KeyboardShortcutsProvider>
        <Suspense fallback={null}><RouteProgress /></Suspense>
        <div className="min-h-screen flex flex-col">
          <DemoBanner />
          <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg text-brand-600">
                <span className="text-2xl">🎬</span>
                KOL System
              </Link>
              <nav className="hidden sm:flex items-center gap-6 text-sm">
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center">
                  Dashboard
                  <ProcessingBadge />
                </Link>
                <Link href="/products" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Sản phẩm
                </Link>
                <Link href="/kol-profiles" className="text-gray-600 hover:text-gray-900 transition-colors">
                  KOL Profiles
                </Link>
                <Link href="/schedule" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Lịch đăng
                </Link>
                <Link href="/assets" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Assets
                </Link>
                <Link href="/admin/queues" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Queues
                </Link>
                <Link href="/admin/costs" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Chi phí
                </Link>
                <Link href="/docs" className="text-gray-600 hover:text-gray-900 transition-colors">
                  API Docs
                </Link>
                <Link href="/settings" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Cài đặt
                </Link>
                <Link
                  href="/projects/new"
                  className="bg-brand-600 text-white px-4 py-1.5 rounded-full hover:bg-brand-700 transition-colors font-medium"
                >
                  + Tạo video mới
                </Link>
                <NotificationBell />
                <ThemeToggle />
              </nav>
              <MobileNav />
            </div>
          </header>

          <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
            {children}
          </main>

          <footer className="border-t border-gray-200 text-center text-xs text-gray-400 py-4">
            KOL System · Powered by Claude + Kling + ElevenLabs
          </footer>
          <ScrollToTop />
        </div>
        </KeyboardShortcutsProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
