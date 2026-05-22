import { notFound } from "next/navigation";
import { prisma } from "@kol/database";
import { StatusBadge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: { id: string } }) {
  const project = await prisma.videoProject.findUnique({
    where: { id: params.id },
    include: {
      product: { select: { name: true, description: true, imageUrls: true } },
      scripts: { where: { isApproved: true }, take: 1 },
    },
  });

  if (!project) notFound();

  const approvedScript = project.scripts[0];
  const PLATFORM_NAMES: Record<string, string> = {
    tiktok: "TikTok", facebook: "Facebook Reels",
    instagram: "Instagram", youtube_shorts: "YouTube Shorts",
  };

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🎬</div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {project.title ?? `KOL Video Project`}
        </h1>
        <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
          <span>{PLATFORM_NAMES[project.platform] ?? project.platform}</span>
          <span>·</span>
          <span>{project.durationSeconds}s</span>
          <span>·</span>
          <StatusBadge status={project.status} />
        </div>
      </div>

      {/* Final video */}
      {project.finalVideoUrl && (
        <div className="mb-8 flex flex-col items-center">
          <video
            src={project.finalVideoUrl}
            controls
            loop
            playsInline
            className="rounded-2xl shadow-lg bg-black"
            style={{ width: 280, aspectRatio: "9/16" }}
          />
          <a
            href={project.finalVideoUrl}
            download
            className="mt-4 inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            ⬇ Tải xuống
          </a>
        </div>
      )}

      {/* Product info */}
      {project.product && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Sản phẩm</h2>
          <p className="font-medium text-gray-900">{project.product.name}</p>
          {project.product.description && (
            <p className="text-sm text-gray-500 mt-1">{project.product.description}</p>
          )}
        </div>
      )}

      {/* Approved script */}
      {approvedScript && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Kịch bản</h2>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {approvedScript.fullScript}
          </p>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-8">
        Tạo bởi KOL System · AI Video Generator
      </p>
    </div>
  );
}
