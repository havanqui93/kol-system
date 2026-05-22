"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h2>
        <p className="text-gray-500 text-sm mb-6">
          {error.message ?? "Có gì đó không ổn. Vui lòng thử lại hoặc về trang chủ."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Thử lại
          </button>
          <Link
            href="/"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Về Dashboard
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-400 mt-4">Mã lỗi: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
