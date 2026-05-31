import { prisma } from "@kol/database";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ArchivedProjectsPage() {
  const projects = await prisma.videoProject.findMany({
    where: { userId: "demo-user", archivedAt: { not: null } },
    orderBy: { archivedAt: "desc" },
    include: {
      product: { select: { name: true } },
    },
    take: 100,
  });

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đã lưu trữ</h1>
          <p className="text-sm text-gray-500 mt-1">{projects.length} project đã lưu trữ</p>
        </div>
        <Link href="/" className="text-sm text-brand-600 hover:underline">← Dashboard</Link>
      </div>

      {projects.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Chưa có project nào được lưu trữ.</p>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <Link
                  href={`/projects/${p.id}`}
                  className="font-medium text-gray-800 hover:text-brand-600 truncate block"
                >
                  {p.title ?? `Video ${p.id.slice(-6)}`}
                </Link>
                <div className="text-xs text-gray-400 mt-0.5">
                  {p.product?.name ?? "—"} · {p.status} ·{" "}
                  Lưu trữ {p.archivedAt ? new Date(p.archivedAt).toLocaleDateString("vi-VN") : ""}
                </div>
              </div>
              <form
                action={async () => {
                  "use server";
                  await prisma.videoProject.update({
                    where: { id: p.id },
                    data: { archivedAt: null },
                  });
                }}
              >
                <button
                  type="submit"
                  className="text-xs text-brand-600 hover:underline px-2 py-1"
                >
                  Khôi phục
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
