"use client";

import { useState, useEffect } from "react";

export function HealthDot() {
  const [status, setStatus] = useState<"ok" | "error" | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const r = await fetch("/api/health");
        const d = await r.json();
        setStatus(d.status === "ok" ? "ok" : "error");
      } catch {
        setStatus("error");
      }
    }
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  if (status === null) return null;

  return (
    <span
      title={status === "ok" ? "Tất cả dịch vụ hoạt động" : "Có sự cố dịch vụ"}
      className={`inline-block w-2 h-2 rounded-full ${status === "ok" ? "bg-green-400" : "bg-red-400 animate-pulse"}`}
    />
  );
}
