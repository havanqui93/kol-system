import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl mb-6">🎬</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">404</h1>
      <p className="text-gray-500 mb-8">Trang này không tồn tại hoặc đã bị xóa.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
        <Link
          href="/"
          className="bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 transition-colors font-medium"
        >
          Về Dashboard
        </Link>
        <Link
          href="/projects/new"
          className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          + Tạo video mới
        </Link>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-400">
        <Link href="/products" className="hover:text-gray-600 hover:underline">Sản phẩm</Link>
        <span>·</span>
        <Link href="/kol-profiles" className="hover:text-gray-600 hover:underline">KOL Profiles</Link>
        <span>·</span>
        <Link href="/settings" className="hover:text-gray-600 hover:underline">Cài đặt</Link>
      </div>
    </div>
  );
}
