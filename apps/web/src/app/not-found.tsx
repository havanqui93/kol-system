import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="text-6xl mb-6">🎬</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">404</h1>
      <p className="text-gray-500 mb-8">Trang này không tồn tại hoặc đã bị xóa.</p>
      <Link
        href="/"
        className="bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 transition-colors font-medium"
      >
        Về Dashboard
      </Link>
    </div>
  );
}
