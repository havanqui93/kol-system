"use client";

export function SearchTrigger() {
  function open() {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  }

  return (
    <button
      onClick={open}
      title="Tìm kiếm (Ctrl+K)"
      className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400 border border-gray-200 rounded-lg px-2.5 py-1 hover:border-gray-300 hover:text-gray-600 transition-colors"
    >
      <span>⌕</span>
      <span>Tìm kiếm</span>
      <kbd className="bg-gray-100 px-1 rounded text-[10px]">Ctrl+K</kbd>
    </button>
  );
}
