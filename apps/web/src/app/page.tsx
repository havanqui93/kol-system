import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@kol/database";
import { ProjectCard } from "@/components/project/project-card";
import { ProjectFilter } from "@/components/project/project-filter";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import type { Project } from "@/lib/api/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type SortOrder = "newest" | "oldest" | "status";

function buildOrderBy(sort: SortOrder) {
  if (sort === "oldest") return { createdAt: "asc" as const };
  if (sort === "status") return { status: "asc" as const };
  return { createdAt: "desc" as const };
}

async function getProjects(
  q: string,
  status: string,
  platform: string,
  sort: SortOrder,
  page: number
): Promise<{ projects: Project[]; total: number }> {
  const where = {
    userId: "demo-user",
    archivedAt: null, // hide archived projects by default
    ...(status ? { status: status as any } : {}),
    ...(platform ? { platform: platform as any } : {}),
    ...(q
      ? {
          title: { contains: q, mode: "insensitive" as const },
        }
      : {}),
  };

  const [projects, total] = await Promise.all([
    prisma.videoProject.findMany({
      where,
      orderBy: buildOrderBy(sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        product: { select: { name: true } },
        kolProfile: { select: { name: true } },
        costTracking: { select: { totalCostUsd: true } },
      },
    }),
    prisma.videoProject.count({ where }),
  ]);

  return { projects: projects as unknown as Project[], total };
}

async function getAllStats() {
  const all = await prisma.videoProject.findMany({
    where: { userId: "demo-user", archivedAt: null },
    select: { status: true, finalVideoUrl: true },
  });
  return {
    total: all.length,
    done: all.filter((p) => p.finalVideoUrl).length,
    processing: all.filter((p) =>
      ["script_generating", "audio_generating", "video_generating", "rendering"].includes(p.status)
    ).length,
    failed: all.filter((p) => p.status === "failed").length,
  };
}

interface PageProps {
  searchParams: { q?: string; status?: string; platform?: string; page?: string; sort?: string };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const q = searchParams.q ?? "";
  const status = searchParams.status ?? "";
  const platform = searchParams.platform ?? "";
  const sort = (searchParams.sort ?? "newest") as SortOrder;
  const page = Math.max(1, Number(searchParams.page ?? "1"));

  const [{ projects, total }, stats] = await Promise.all([
    getProjects(q, status, platform, sort, page),
    getAllStats(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const isFiltered = q || status || platform;

  return (
    <div>
      {/* Hero */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            {stats.total} video project{stats.total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/projects/new">
          <Button size="lg">+ Tạo video mới</Button>
        </Link>
      </div>

      {/* Stats row */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Tổng video", value: stats.total },
            { label: "Đã hoàn thành", value: stats.done },
            { label: "Đang xử lý", value: stats.processing },
            { label: "Thất bại", value: stats.failed },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search & Filter */}
      {stats.total > 0 && (
        <div className="mb-5">
          <Suspense fallback={null}>
            <ProjectFilter />
          </Suspense>
        </div>
      )}

      {/* Project list */}
      {projects.length === 0 ? (
        <div className="text-center py-24">
          {isFiltered ? (
            <>
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold text-gray-700">Không tìm thấy video</h2>
              <p className="text-gray-500 mt-2 mb-6">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
              <Link href="/">
                <Button variant="outline">Xoá bộ lọc</Button>
              </Link>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">🎬</div>
              <h2 className="text-xl font-semibold text-gray-700">Chưa có video nào</h2>
              <p className="text-gray-500 mt-2 mb-6">Tạo video KOL đầu tiên của bạn chỉ trong vài bước</p>
              <Link href="/projects/new">
                <Button size="lg">Tạo video đầu tiên</Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <ErrorBoundary>
            <Suspense fallback={<DashboardSkeleton />}>
              <div className="grid gap-3">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </Suspense>
          </ErrorBoundary>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/?${new URLSearchParams({ q, status, platform, page: String(page - 1) }).toString()}`}
                  >
                    <Button variant="outline" size="sm">
                      ← Trước
                    </Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/?${new URLSearchParams({ q, status, platform, page: String(page + 1) }).toString()}`}
                  >
                    <Button variant="outline" size="sm">
                      Tiếp →
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
