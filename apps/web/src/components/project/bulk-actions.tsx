"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function BulkDeleteFailed({ failedCount }: { failedCount: number }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (failedCount === 0) return null;

  async function handleBulkDelete() {
    setShowConfirm(false);
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

  async function handleBulkRetry() {
    setLoading(true);
    try {
      const res = await fetch("/api/video-projects/bulk?status=failed", {
        method: "PATCH",
        headers: { "x-user-id": "demo-user" },
      });
      if (!res.ok) throw new Error();
      const { reset } = await res.json();
      success(`Đã reset ${reset} dự án về nháp`);
      router.refresh();
    } catch {
      toastError("Thao tác thất bại, thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ConfirmDialog
        open={showConfirm}
        title="Xóa dự án thất bại"
        message={`Xóa tất cả ${failedCount} dự án thất bại? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa tất cả"
        danger
        onConfirm={handleBulkDelete}
        onCancel={() => setShowConfirm(false)}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleBulkRetry}
          disabled={loading}
          className="text-xs text-brand-600 hover:text-brand-800 hover:underline disabled:opacity-50 transition-colors"
        >
          {loading ? "Đang xử lý..." : `↺ Reset về nháp (${failedCount})`}
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50 transition-colors"
        >
          {loading ? "Đang xóa..." : `Xóa tất cả thất bại (${failedCount})`}
        </button>
      </div>
    </>
  );
}
