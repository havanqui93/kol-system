import { NextResponse } from "next/server";
import { prisma } from "@kol/database";

// GET /api/video-projects/:id/export-script — export approved script as plain text
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const project = await prisma.videoProject.findUnique({
    where: { id: params.id },
    select: {
      title: true,
      platform: true,
      durationSeconds: true,
      scripts: {
        where: { isApproved: true },
        select: {
          hook: true,
          problem: true,
          introduction: true,
          benefits: true,
          proof: true,
          offer: true,
          cta: true,
          wordCount: true,
          estimatedDurationSeconds: true,
          scenes: {
            select: { order: true, voiceText: true, visualPrompt: true, durationSeconds: true },
            orderBy: { order: "asc" },
          },
        },
        take: 1,
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const script = project.scripts[0];
  if (!script) return NextResponse.json({ error: "Chưa có kịch bản được duyệt" }, { status: 404 });

  const SECTIONS = [
    { key: "hook", label: "HOOK" },
    { key: "problem", label: "VẤN ĐỀ" },
    { key: "introduction", label: "GIỚI THIỆU SẢN PHẨM" },
    { key: "benefits", label: "LỢI ÍCH" },
    { key: "proof", label: "BẰNG CHỨNG" },
    { key: "offer", label: "ƯU ĐÃI" },
    { key: "cta", label: "KÊU GỌI HÀNH ĐỘNG" },
  ] as const;

  const lines: string[] = [
    `# ${project.title}`,
    `Platform: ${project.platform} | Duration: ${project.durationSeconds}s`,
    `Word count: ~${script.wordCount ?? "?"} | Est. duration: ~${script.estimatedDurationSeconds ?? "?"}s`,
    "",
    "## KỊCH BẢN",
    "",
  ];

  for (const { key, label } of SECTIONS) {
    const text = (script as any)[key];
    if (text) {
      lines.push(`### ${label}`);
      lines.push(text);
      lines.push("");
    }
  }

  if (script.scenes.length > 0) {
    lines.push("## PHÂN CẢNH");
    lines.push("");
    for (const scene of script.scenes) {
      lines.push(`### Cảnh ${scene.order}${scene.durationSeconds ? ` (${scene.durationSeconds}s)` : ""}`);
      lines.push(`Lời thoại: ${scene.voiceText}`);
      if (scene.visualPrompt) lines.push(`Visual: ${scene.visualPrompt}`);
      lines.push("");
    }
  }

  const text = lines.join("\n");
  const filename = `script-${params.id.slice(-8)}.txt`;

  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
