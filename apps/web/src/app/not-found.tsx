import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <div className="text-6xl mb-4">🎬</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy trang</h2>
      <p className="text-gray-500 mb-8">Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xoá.</p>
      <Link href="/">
        <Button size="lg">Về Dashboard</Button>
      </Link>
    </div>
  );
}
