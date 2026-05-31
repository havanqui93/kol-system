import { notFound } from "next/navigation";
import { redis } from "@/lib/redis";
import { prisma } from "@kol/database";
import { StatusBadge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface Props { params: { token: string } }

export default async function SharePage({ params }: Props) {
  const projectId = await redis.get(`share:token:${params.token}`);
  if (!projectId) notFound();

  const project = await prisma.videoProject.findUnique({
    where: { id: projectId as string },
    select: {
      id: true,
      title: true,
      platform: true,
      videoType: true,
      durationSeconds: true,
      status: true,
      finalVideoUrl: true,
      createdAt: true,
      scripts: {
        where: { isApproved: true },
        select: {
          hook: true,
          scenes: {
            select: { order: true, voiceText: true, visualPrompt: true },
            orderBy: { order: "asc" },
          },
        },
        take: 1,
      },
    },
  });

  if (!project) notFound();
  const script = project.scripts[0];

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <span>🎬 KOL System</span>
          <span>·</span>
          <span>Shared video</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {project.title ?? "Video Project"}
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={project.status} />
          <span className="text-xs text-gray-500 capitalize">{project.platform.replace("_", " ")}</span>
          <span className="text-xs text-gray-500">{project.durationSeconds}s</span>
          <span className="text-xs text-gray-500">{new Date(project.createdAt).toLocaleDateString("vi-VN")}</span>
        </div>
      </div>

      {/* Final video */}
      {project.finalVideoUrl && (
        <div className="mb-8">
          <video
            src={project.finalVideoUrl}
            controls
            preload="metadata"
            className="w-full max-w-sm mx-auto rounded-xl bg-black shadow-lg"
            style={{ aspectRatio: "9/16" }}
          />
        </div>
      )}

      {/* Script */}
      {script && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Hook</div>
            <p className="text-gray-800 font-medium">{script.hook}</p>
          </div>

          {script.scenes.map((scene, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Cảnh {scene.order}
              </div>
              <p className="text-gray-800 mb-3">{scene.voiceText}</p>
              {scene.visualPrompt && (
                <p className="text-xs text-gray-400 italic">{scene.visualPrompt}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-gray-300">
        Link này hết hạn sau 7 ngày · Tạo bởi KOL System
      </p>
    </div>
  );
}
