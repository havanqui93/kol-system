"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const SHORTCUTS = [
  { keys: ["n"], description: "Tạo video mới" },
  { keys: ["p"], description: "Mở thư viện sản phẩm" },
  { keys: ["k"], description: "Mở KOL Profiles" },
  { keys: ["s"], description: "Mở trang cài đặt" },
  { keys: ["r"], description: "Làm mới dự án (trang chi tiết)" },
  { keys: ["/"], description: "Tìm kiếm trong danh sách" },
  { keys: ["Ctrl", "K"], description: "Tìm kiếm nhanh toàn bộ" },
  { keys: ["?"], description: "Hiện/ẩn danh sách phím tắt" },
  { keys: ["Esc"], description: "Đóng hộp thoại / menu" },
];

export function ShortcutsHelp() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;
      if (e.key === "?" && !isInput) {
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
      if (e.key === "n" && !isInput && !e.ctrlKey && !e.metaKey) {
        router.push("/projects/new");
      }
      if (e.key === "p" && !isInput && !e.ctrlKey && !e.metaKey) {
        router.push("/products");
      }
      if (e.key === "k" && !isInput && !e.ctrlKey && !e.metaKey) {
        router.push("/kol-profiles");
      }
      if (e.key === "s" && !isInput && !e.ctrlKey && !e.metaKey) {
        router.push("/settings");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Phím tắt (?)"
        className="fixed bottom-4 right-4 z-20 w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-300 transition-colors flex items-center justify-center shadow"
        aria-label="Hiện phím tắt"
      >
        ?
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="dialog"
            aria-modal
            aria-label="Phím tắt bàn phím"
            className="fixed bottom-14 right-4 z-40 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-72"
          >
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Phím tắt</h3>
            <div className="space-y-2">
              {SHORTCUTS.map(({ keys, description }) => (
                <div key={keys.join("+")} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-gray-600">{description}</span>
                  <div className="flex gap-1">
                    {keys.map((k) => (
                      <kbd key={k} className="text-xs bg-gray-100 border border-gray-300 rounded px-1.5 py-0.5 font-mono">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
