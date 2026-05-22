"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Spinner } from "@/components/ui/spinner";

type StepStatus = "pending" | "active" | "done" | "error";

interface PipelineStepProps {
  step: number;
  title: string;
  description: string;
  status: StepStatus;
  children?: React.ReactNode;
}

export function PipelineStep({ step, title, description, status, children }: PipelineStepProps) {
  // Completed steps default to collapsed; active/error always open
  const [collapsed, setCollapsed] = useState(status === "done");

  const icons: Record<StepStatus, React.ReactNode> = {
    pending: <span className="text-sm font-bold text-gray-400">{step}</span>,
    active: <Spinner className="w-4 h-4" />,
    done: <span className="text-sm">✓</span>,
    error: <span className="text-sm">✕</span>,
  };

  const ringColor: Record<StepStatus, string> = {
    pending: "border-gray-200 bg-gray-50",
    active: "border-brand-400 bg-brand-50",
    done: "border-green-300 bg-green-50/50",
    error: "border-red-400 bg-red-50",
  };

  const textColor: Record<StepStatus, string> = {
    pending: "text-gray-400",
    active: "text-brand-700",
    done: "text-green-700",
    error: "text-red-700",
  };

  const canCollapse = status === "done" && !!children;

  return (
    <div className={clsx("rounded-xl border p-4", ringColor[status])}>
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0",
            ringColor[status]
          )}
        >
          {icons[status]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className={clsx("font-semibold text-sm", textColor[status])}>{title}</div>
              <div className="text-xs text-gray-500 mt-0.5">{description}</div>
            </div>
            {canCollapse && (
              <button
                onClick={() => setCollapsed((v) => !v)}
                className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-600 transition-colors px-1"
                aria-label={collapsed ? "Mở rộng" : "Thu gọn"}
              >
                {collapsed ? "▾ Xem" : "▴ Thu"}
              </button>
            )}
          </div>
          {children && !collapsed && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </div>
  );
}
