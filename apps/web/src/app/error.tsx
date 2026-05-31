"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="vi">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center px-4">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h1>
            <p className="text-gray-500 mb-2">Có lỗi xảy ra trong ứng dụng. Vui lòng thử lại.</p>
            {error.digest && (
              <p className="text-xs text-gray-400 font-mono mb-6">ID lỗi: {error.digest}</p>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={reset}>Thử lại</Button>
              <Button variant="secondary" onClick={() => (window.location.href = "/")}>
                Về Dashboard
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
