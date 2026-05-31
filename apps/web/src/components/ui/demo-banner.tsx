"use client";

import { useState } from "react";

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-xs py-2 px-4 flex items-center justify-between">
      <span>
        ⚠️ Chế độ demo — đang dùng tài khoản <code className="font-mono">demo-user</code>. Không lưu dữ liệu nhạy cảm.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-4 text-yellow-600 hover:text-yellow-800"
      >
        ✕
      </button>
    </div>
  );
}
