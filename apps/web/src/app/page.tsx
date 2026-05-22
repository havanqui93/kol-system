import Link from "next/link";
import { prisma } from "@kol/database";
import { ProjectFilter } from "@/components/project/project-filter";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/api/client";

// Server component — reads DB directly
export const dynamic = "force-dynamic";

async function getProjects(): Promise<Project[]> {
  const rows = await prisma.videoProject.findMany({
    where: { userId: "demo-user" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      product: { select: { name: true } },
      kolProfile: { select: { name: true } },
    },
  });
  return rows as unknown as Project[];
}

export default async function DashboardPage() {
  const projects = await getProjects();

  return (
    <div>
      {/* Hero */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            {projects.length} video project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/projects/new">
          <Button size="lg">+ Tạo video mới</Button>
        </Link>
      </div>

      {/* Stats row */}
      {projects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Tổng video", value: projects.length },
            { label: "Đã hoàn thành", value: projects.filter((p) => p.finalVideoUrl).length },
            { label: "Đang xử lý", value: projects.filter((p) => ["script_generating","audio_generating","video_generating","rendering"].includes(p.status)).length },
            { label: "Thất bại", value: projects.filter((p) => p.status === "failed").length },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Project list with search + filter */}
      {projects.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🎬</div>
          <h2 className="text-xl font-semibold text-gray-700">Chưa có video nào</h2>
          <p className="text-gray-500 mt-2 mb-6">Tạo video KOL đầu tiên của bạn chỉ trong vài bước</p>
          <Link href="/projects/new">
            <Button size="lg">Tạo video đầu tiên</Button>
          </Link>
        </div>
      ) : (
        <ProjectFilter initialProjects={projects} />
      )}
    </div>
  );
}
