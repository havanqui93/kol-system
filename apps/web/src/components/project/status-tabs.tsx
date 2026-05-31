"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface StatusTabsProps {
  stats: {
    total: number;
    done: number;
    processing: number;
    failed: number;
  };
}

const TABS = [
  { label: "Tất cả", value: "" },
  { label: "Đang xử lý", value: "processing" },
  { label: "Hoàn thành", value: "done" },
  { label: "Thất bại", value: "failed" },
];

const PROCESSING_STATUSES = new Set([
  "script_generating",
  "audio_generating",
  "video_generating",
  "rendering",
  "publishing",
]);

export function StatusTabs({ stats }: StatusTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeTab = searchParams.get("tab") ?? "";

  function navigate(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab) {
      params.set("tab", tab);
    } else {
      params.delete("tab");
    }
    // Clear status filter when switching tabs
    params.delete("status");
    params.delete("page");
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  const counts: Record<string, number> = {
    "": stats.total,
    processing: stats.processing,
    done: stats.done,
    failed: stats.failed,
  };

  return (
    <div className={`flex gap-1 ${isPending ? "opacity-60" : ""}`}>
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => navigate(tab.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === tab.value
              ? "bg-brand-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {tab.label}
          <span
            className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.value ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            {counts[tab.value] ?? 0}
          </span>
        </button>
      ))}
    </div>
  );
}

export { PROCESSING_STATUSES };
