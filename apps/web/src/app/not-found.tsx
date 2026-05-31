import Link from "next/link";
import { Button } from "@/components/ui/button";

const QUICK_LINKS = [
  { href: "/", label: "🏠 Dashboard" },
  { href: "/projects/new", label: "🎬 Tạo video mới" },
  { href: "/products", label: "📦 Sản phẩm" },
  { href: "/kol-profiles", label: "👤 KOL Profiles" },
  { href: "/music", label: "🎵 Thư viện nhạc" },
  { href: "/platform-guide", label: "📱 Hướng dẫn nền tảng" },
];

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <div className="text-7xl mb-6">🎬</div>
      <h1 className="text-4xl font-black text-gray-900 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-3">Không tìm thấy trang</h2>
      <p className="text-gray-500 mb-8 max-w-sm mx-auto">
        Trang bạn đang tìm kiếm không tồn tại, đã bị xoá, hoặc chưa được tạo.
      </p>

      <div className="flex justify-center gap-3 mb-10">
        <Link href="/">
          <Button size="lg">Về Dashboard</Button>
        </Link>
        <Link href="/projects/new">
          <Button size="lg" variant="outline">Tạo video mới</Button>
        </Link>
      </div>

      <div className="max-w-xs mx-auto">
        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide font-medium">Hoặc truy cập nhanh</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-gray-600 hover:text-brand-600 hover:bg-brand-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-brand-200 transition-colors text-left"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
