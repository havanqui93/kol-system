"use client";

import { useEffect, useState } from "react";

export function ProcessingBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/metrics");
        if (!res.ok) return;
        const data = await res.json();
        // Sum active jobs across all queues
        const active = Object.values(data.queues ?? {}).reduce(
          (sum: number, q: any) => sum + (q.active ?? 0),
          0
        );
        setCount(active as number);
      } catch {
        // ignore
      }
    }

    poll();
    const interval = setInterval(poll, 10_000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <span
      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold"
      title={`${count} job đang xử lý`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
