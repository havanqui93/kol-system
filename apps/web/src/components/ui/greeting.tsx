"use client";

import { useMemo } from "react";

export function DashboardGreeting() {
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Chào buổi sáng";
    if (h < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  }, []);

  return (
    <span className="text-gray-400 text-sm font-normal ml-2">{greeting} 👋</span>
  );
}
