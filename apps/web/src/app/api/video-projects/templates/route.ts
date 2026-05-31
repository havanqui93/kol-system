import { NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/redis";

const TEMPLATE_KEY_PREFIX = "project:template:";
const MAX_TEMPLATES = 20;

interface ProjectTemplate {
  id: string;
  name: string;
  platform: string;
  videoType: string;
  durationSeconds: number;
  qualityPreset: string;
  language: string;
  brandTone?: string;
  createdAt: string;
}

// GET /api/video-projects/templates — list saved templates
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const keys = await redis.keys(`${TEMPLATE_KEY_PREFIX}${userId}:*`);

  const templates = await Promise.all(
    keys.map(async (key) => {
      const val = await redis.get(key);
      try { return JSON.parse(val!) as ProjectTemplate; } catch { return null; }
    })
  );

  return NextResponse.json({
    templates: templates.filter(Boolean).sort(
      (a, b) => new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()
    ),
  });
}

const SaveTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  platform: z.string(),
  videoType: z.string(),
  durationSeconds: z.number().int().min(15).max(60),
  qualityPreset: z.string(),
  language: z.string(),
  brandTone: z.string().optional(),
});

// POST /api/video-projects/templates — save a new template
export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const body = await request.json();
  const data = SaveTemplateSchema.parse(body);

  const existing = await redis.keys(`${TEMPLATE_KEY_PREFIX}${userId}:*`);
  if (existing.length >= MAX_TEMPLATES) {
    return NextResponse.json({ error: `Max ${MAX_TEMPLATES} templates allowed` }, { status: 400 });
  }

  const id = `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const template: ProjectTemplate = { id, ...data, createdAt: new Date().toISOString() };
  await redis.set(`${TEMPLATE_KEY_PREFIX}${userId}:${id}`, JSON.stringify(template));

  return NextResponse.json(template, { status: 201 });
}
