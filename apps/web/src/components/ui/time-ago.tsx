"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/format";

interface TimeAgoProps {
  date: string | Date;
  className?: string;
  updateIntervalMs?: number;
}

export function TimeAgo({ date, className = "", updateIntervalMs = 60_000 }: TimeAgoProps) {
  const [label, setLabel] = useState(() => formatRelativeTime(date));

  useEffect(() => {
    setLabel(formatRelativeTime(date));
    const timer = setInterval(() => setLabel(formatRelativeTime(date)), updateIntervalMs);
    return () => clearInterval(timer);
  }, [date, updateIntervalMs]);

  const fullDate = new Date(date).toLocaleString("vi-VN");

  return (
    <time
      dateTime={new Date(date).toISOString()}
      title={fullDate}
      className={className}
    >
      {label}
    </time>
  );
}
