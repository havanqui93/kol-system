import { prisma } from "@kol/database";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { category?: string };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const category = searchParams.category ?? "";

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        userId: "demo-user",
        ...(category ? { category } : {}),
      },
      include: {
        _count: { select: { videoProjects: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { userId: "demo-user", category: { not: null } },
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sản phẩm</h1>
          <p className="mt-1 text-sm text-gray-500">{products.length} sản phẩm</p>
        </div>
        <Link href="/projects/new">
          <Button>+ Thêm sản phẩm mới</Button>
        </Link>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href="/products"
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${!category ? "bg-brand-600 text-white border-brand-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            Tất cả
          </Link>
          {categories.map((c) => c.category && (
            <Link
              key={c.category}
              href={`/products?category=${encodeURIComponent(c.category)}`}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${category === c.category ? "bg-brand-600 text-white border-brand-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {c.category}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-700">Chưa có sản phẩm nào</h2>
          <p className="text-gray-500 mt-2 mb-6">Tạo video đầu tiên để tự động lưu sản phẩm</p>
          <Link href="/projects/new">
            <Button size="lg">Tạo video đầu tiên</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Product image */}
              <div className="h-36 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                {product.imageUrls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrls[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl">📦</span>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                {product.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {product.price && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                      {Number(product.price).toLocaleString("vi-VN")}đ
                    </span>
                  )}
                  {product.promotion && (
                    <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                      {product.promotion}
                    </span>
                  )}
                  {product.category && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {product.category}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{product._count.videoProjects} video</span>
                  <div className="flex items-center gap-3">
                    <Link href={`/products/${product.id}`} className="text-xs text-gray-500 hover:text-gray-700">
                      Sửa
                    </Link>
                    <Link
                      href={`/?productId=${product.id}`}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Xem video →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
