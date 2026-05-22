"use client";

import { useState } from "react";

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const encodedUrl = typeof window !== "undefined" ? encodeURIComponent(window.location.href) : "";
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="mt-8 text-center">
      <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide font-medium">Chia sẻ</p>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-gray-300 bg-white text-gray-700 hover:border-gray-400 transition-colors"
        >
          {copied ? "✓ Đã sao chép" : "🔗 Sao chép link"}
        </button>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          📘 Facebook
        </a>
        <a
          href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
        >
          💬 WhatsApp
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-colors"
        >
          🐦 Twitter/X
        </a>
      </div>
    </div>
  );
}
