import { NextResponse } from "next/server";
import { getAllBreakerStats } from "@/lib/circuit-breaker";

export async function GET() {
  const stats = getAllBreakerStats();
  return NextResponse.json({ breakers: stats, count: stats.length });
}
