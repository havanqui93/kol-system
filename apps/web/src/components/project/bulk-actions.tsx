"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export function BulkDeleteFailed({ failedCount }: { failedCount: number }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);

  if (failedCount === 0) return null;

  async function handleBulkDelete() {
    if (!confirm(`Xóa tất cả ${failedCount} dự án thất bại? Hành động không thể hoàn tác.`)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/video-projects/bulk?status=failed", {
        method: "DELETE",
        headers: { "x-user-id": "demo-user" },
      });
      if (!res.ok) throw new Error();
      const { deleted } = await res.json();
      success(`Đã xóa ${deleted} dự án thất bại`);
      router.refresh();
    } catch {
      toastError("Xóa thất bại, thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleBulkDelete}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50 transition-colors"
    >
      {loading ? "Đang xóa..." : `Xóa tất cả thất bại (${failedCount})`}
    </button>
  );
}
