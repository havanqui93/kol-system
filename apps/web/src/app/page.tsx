import Link from "next/link";
import { prisma } from "@kol/database";
import { ProjectFilter } from "@/components/project/project-filter";
import { BulkDeleteFailed } from "@/components/project/bulk-actions";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/api/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

async function getProjects(page: number): Promise<{ projects: Project[]; total: number }> {
  const [rows, total] = await Promise.all([
    prisma.videoProject.findMany({
      where: { userId: "demo-user" },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        product: { select: { name: true } },
        kolProfile: { select: { name: true } },
      },
    }),
    prisma.videoProject.count({ where: { userId: "demo-user" } }),
  ]);
  return { projects: rows as unknown as Project[], total };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams?.page ?? "1"));
  const { projects, total } = await getProjects(page);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const stats = await prisma.videoProject.groupBy({
    by: ["status"],
    where: { userId: "demo-user" },
    _count: true,
  });

  const statMap = Object.fromEntries(stats.map((s) => [s.status, s._count]));
  const completed = Object.entries(statMap).filter(([s]) => s === "published" || s === "ready_to_publish").reduce((a, [, v]) => a + v, 0);
  const processing = Object.entries(statMap).filter(([s]) => ["script_generating", "audio_generating", "video_generating", "rendering"].includes(s)).reduce((a, [, v]) => a + v, 0);
  const failed = statMap["failed"] ?? 0;
  const scriptReady = statMap["script_ready"] ?? 0;

  // Total cost across all projects
  const costAgg = await prisma.costTracking.aggregate({
    where: { project: { userId: "demo-user" } },
    _sum: { totalCostUsd: true },
  });

  return (
    <div>
      {/* Hero */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">{total} dự án video</p>
        </div>
        <Link href="/projects/new">
          <Button size="lg">+ Tạo video mới</Button>
        </Link>
      </div>

      {/* Stats row */}
      {total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Tổng video", value: total },
            { label: "Hoàn thành", value: completed },
            { label: "Chờ duyệt", value: scriptReady },
            { label: "Đang xử lý", value: processing },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Cost summary */}
      {costAgg._sum.totalCostUsd && Number(costAgg._sum.totalCostUsd) > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 mb-6 text-sm">
          <span className="text-blue-700 font-medium">Tổng chi phí AI</span>
          <span className="text-blue-900 font-bold">${Number(costAgg._sum.totalCostUsd).toFixed(4)}</span>
        </div>
      )}

      {/* Bulk actions row */}
      {failed > 0 && (
        <div className="flex justify-end mb-3">
          <BulkDeleteFailed failedCount={failed} />
        </div>
      )}

      {/* Project list with search + filter */}
      {projects.length === 0 && page === 1 ? (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          {page > 1 && (
            <Link href={`/?page=${page - 1}`}>
              <Button variant="secondary" size="sm">← Trước</Button>
            </Link>
          )}
          <span className="text-sm text-gray-500">
            Trang {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/?page=${page + 1}`}>
              <Button variant="secondary" size="sm">Sau →</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
