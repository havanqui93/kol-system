import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@kol/database";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id") ?? "demo-user";
  const [scriptReady, failed] = await Promise.all([
    prisma.videoProject.count({ where: { userId, status: "script_ready" } }),
    prisma.videoProject.count({ where: { userId, status: "failed" } }),
  ]);
  return NextResponse.json({ scriptReady, failed });
}
