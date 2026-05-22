"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ProjectError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="max-w-3xl mx-auto text-center py-24">
      <div className="text-4xl mb-4">📋</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Không thể tải dự án</h2>
      <p className="text-gray-500 text-sm mb-6">{error.message ?? "Vui lòng thử lại sau."}</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          Thử lại
        </button>
        <Link href="/" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          Về Dashboard
        </Link>
      </div>
    </div>
  );
}
