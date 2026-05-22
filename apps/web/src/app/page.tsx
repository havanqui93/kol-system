import Link from "next/link";
import { prisma } from "@kol/database";
import { ProjectFilter } from "@/components/project/project-filter";
import { BulkDeleteFailed } from "@/components/project/bulk-actions";
import { LastVisitedBanner } from "@/components/project/last-visited-banner";
import { DashboardGreeting } from "@/components/ui/greeting";
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
        product: { select: { name: true, imageUrls: true } },
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
  searchParams: { page?: string; status?: string };
}) {
  const page = Math.max(1, Number(searchParams?.page ?? "1"));
  const initialStatus = searchParams?.status ?? "";
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

  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [productCount, kolProfileCount, todayCount, weekCount] = await Promise.all([
    prisma.product.count({ where: { userId: "demo-user" } }),
    prisma.kolProfile.count({ where: { userId: "demo-user" } }),
    prisma.videoProject.count({
      where: {
        userId: "demo-user",
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.videoProject.count({
      where: { userId: "demo-user", createdAt: { gte: weekAgo } },
    }),
  ]);

  return (
    <div>
      <LastVisitedBanner />

      {/* Hero */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard <DashboardGreeting /></h1>
          <p className="mt-1 text-sm text-gray-500 flex items-center gap-2 flex-wrap">
            <span>{total} dự án video</span>
            {todayCount > 0 && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">+{todayCount} hôm nay</span>}
            {weekCount > 0 && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{weekCount} tuần này</span>}
          </p>
        </div>
        <Link href="/projects/new">
          <Button size="lg">+ Tạo video mới</Button>
        </Link>
      </div>

      {/* Stats row — click to filter */}
      {total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
          {[
            { label: "Tổng video", value: total, filter: "", colorClass: "" },
            { label: "Hoàn thành", value: completed, filter: "ready_to_publish", colorClass: "" },
            { label: "Chờ duyệt", value: scriptReady, filter: "script_ready", colorClass: scriptReady > 0 ? "border-orange-200 bg-orange-50/30 hover:border-orange-400" : "" },
            { label: "Đang xử lý", value: processing, filter: "processing", colorClass: "" },
            { label: "Thất bại", value: failed, filter: "failed", colorClass: failed > 0 ? "border-red-200 bg-red-50/30 hover:border-red-400" : "" },
          ].map((stat) => (
            <Link
              key={stat.label}
              href={stat.filter ? `/?status=${stat.filter}` : "/"}
              className={`bg-white rounded-xl border px-5 py-4 transition-colors hover:shadow-sm block ${initialStatus === stat.filter ? "border-brand-400 bg-brand-50" : stat.colorClass || "border-gray-200 hover:border-brand-300"}`}
            >
              <div className={`text-2xl font-bold ${stat.label === "Thất bại" && stat.value > 0 ? "text-red-600" : "text-gray-900"}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </Link>
          ))}
        </div>
      )}

      {/* Resource counts */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          href="/products"
          className={`bg-white rounded-xl border px-5 py-4 hover:border-brand-300 hover:shadow-sm transition-colors block ${productCount === 0 ? "border-dashed border-orange-300 bg-orange-50/40" : "border-gray-200"}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <div className="text-2xl font-bold text-gray-900">{productCount}</div>
              <div className="text-xs text-gray-500">Sản phẩm{productCount === 0 ? " · Thêm ngay →" : ""}</div>
            </div>
          </div>
        </Link>
        <Link
          href="/kol-profiles"
          className={`bg-white rounded-xl border px-5 py-4 hover:border-brand-300 hover:shadow-sm transition-colors block ${kolProfileCount === 0 ? "border-dashed border-purple-300 bg-purple-50/40" : "border-gray-200"}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎭</span>
            <div>
              <div className="text-2xl font-bold text-gray-900">{kolProfileCount}</div>
              <div className="text-xs text-gray-500">KOL Profiles{kolProfileCount === 0 ? " · Tạo ngay →" : ""}</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Cost summary */}
      {costAgg._sum.totalCostUsd && Number(costAgg._sum.totalCostUsd) > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 mb-6 text-sm">
          <span className="text-blue-700 font-medium">Tổng chi phí AI</span>
          <span className="text-blue-900 font-bold">${Number(costAgg._sum.totalCostUsd).toFixed(4)}</span>
        </div>
      )}

      {/* Script-ready alert */}
      {scriptReady > 0 && (
        <Link href="/?status=script_ready" className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-5 py-3 mb-4 hover:border-orange-300 transition-colors">
          <span className="text-orange-500 text-lg">⏳</span>
          <div className="flex-1">
            <span className="text-sm font-semibold text-orange-800">{scriptReady} kịch bản đang chờ duyệt</span>
            <span className="text-xs text-orange-600 ml-2">Nhấp để xem →</span>
          </div>
        </Link>
      )}

      {/* Bulk actions row */}
      {failed > 0 && (
        <div className="flex justify-end mb-3">
          <BulkDeleteFailed failedCount={failed} />
        </div>
      )}

      {/* Project list with search + filter */}
      {projects.length === 0 && page === 1 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎬</div>
          <h2 className="text-xl font-semibold text-gray-700">Chưa có video nào</h2>
          <p className="text-gray-500 mt-2 mb-8">Tạo video KOL đầu tiên của bạn chỉ trong vài bước</p>

          {/* Getting started checklist */}
          <div className="max-w-sm mx-auto text-left bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 mb-8">
            {[
              { icon: "⚙️", text: "Kiểm tra API keys", href: "/settings", done: false },
              { icon: "📦", text: "Thêm thông tin sản phẩm", href: "/products/new", done: false },
              { icon: "🎭", text: "Tạo KOL profile (avatar)", href: "/kol-profiles/new", done: false },
              { icon: "🎬", text: "Tạo video đầu tiên", href: "/projects/new", done: false },
            ].map((item) => (
              <Link key={item.text} href={item.href} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
                <span className="text-xl">{item.icon}</span>
                <span className="flex-1 text-sm text-gray-700 group-hover:text-brand-700">{item.text}</span>
                <span className="text-gray-300 group-hover:text-brand-400">→</span>
              </Link>
            ))}
          </div>

          <Link href="/projects/new">
            <Button size="lg">Tạo video đầu tiên</Button>
          </Link>
        </div>
      ) : (
        <ProjectFilter initialProjects={projects} initialStatus={initialStatus} />
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
