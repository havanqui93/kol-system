"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProjectCardSkeleton } from "@/components/ui/skeleton";
import { InlineEdit } from "@/components/project/inline-edit";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  currency: string;
  promotion: string | null;
  category: string | null;
  imageUrls: string[];
  createdAt: string;
  _count?: { videoProjects: number };
}

type SortKey = "newest" | "most_videos" | "alpha" | "oldest";

export default function ProductsPage() {
  const { success, error: toastError } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [sort, setSort] = useState<SortKey>(() => {
    if (typeof window !== "undefined") return (localStorage.getItem("kol-products-sort") as SortKey) ?? "newest";
    return "newest";
  });
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/products", { headers: { "x-user-id": "demo-user" } });
    const json = await res.json();
    setProducts(json.products ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => { localStorage.setItem("kol-products-sort", sort); }, [sort]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "x-user-id": "demo-user" },
      });
      if (!res.ok && res.status !== 204) throw new Error();
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      success("Đã xóa sản phẩm");
    } catch {
      toastError("Xóa thất bại, thử lại sau.");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa sản phẩm"
        message={`Xóa "${deleteTarget?.name}"? Các dự án đã tạo sẽ không bị ảnh hưởng.`}
        confirmLabel="Xóa"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thư viện sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? "Đang tải..." : (() => {
              const totalVideos = products.reduce((sum, p) => sum + (p._count?.videoProjects ?? 0), 0);
              const prices = products.map((p) => Number(p.price)).filter((n) => n > 0);
              const priceRange = prices.length > 1
                ? ` · ${Math.min(...prices).toLocaleString("vi-VN")}–${Math.max(...prices).toLocaleString("vi-VN")} VND`
                : "";
              return `${products.length} sản phẩm · ${totalVideos} video tổng${priceRange}`;
            })()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="newest">Mới nhất</option>
            <option value="most_videos">Nhiều video nhất</option>
            <option value="alpha">A → Z</option>
            <option value="oldest">Cũ nhất</option>
          </select>
          <Link href="/products/new">
            <Button size="sm" variant="secondary">+ Thêm sản phẩm</Button>
          </Link>
          <Link href="/projects/new">
            <Button size="sm">+ Tạo video mới</Button>
          </Link>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <ProjectCardSkeleton key={i} />)}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-24 text-gray-400">
          <div className="text-5xl mb-4">📦</div>
          <p className="font-medium text-gray-600">Chưa có sản phẩm nào</p>
          <p className="text-sm mt-1 mb-6">Thêm sản phẩm trực tiếp hoặc tạo dự án video mới.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/products/new">
              <Button>+ Thêm sản phẩm</Button>
            </Link>
            <Link href="/projects/new">
              <Button variant="secondary">Tạo video mới</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-5 relative">
        <input
          ref={searchRef}
          type="search"
          placeholder="Tìm theo tên sản phẩm... (nhấn / để tìm)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Xóa tìm kiếm"
          >
            ×
          </button>
        )}
      </div>

      {search && products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
        <div className="py-12 text-center text-gray-400">
          <p className="text-sm">Không tìm thấy sản phẩm nào cho "<span className="font-medium text-gray-600">{search}</span>"</p>
          <button onClick={() => setSearch("")} className="mt-2 text-xs text-brand-600 hover:underline">Xóa bộ lọc</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...products].filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => {
          if (sort === "most_videos") return (b._count?.videoProjects ?? 0) - (a._count?.videoProjects ?? 0);
          if (sort === "alpha") return a.name.localeCompare(b.name, "vi");
          if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }).map((product) => (
          <Card key={product.id} className="group relative">
            <CardBody className="flex gap-4">
              {/* Product image */}
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {product.imageUrls[0] ? (
                  <img src={product.imageUrls[0]} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  <InlineEdit
                    value={product.name}
                    onSave={async (name) => {
                      await fetch(`/api/products/${product.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json", "x-user-id": "demo-user" },
                        body: JSON.stringify({ name }),
                      });
                      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, name } : p));
                    }}
                  />
                </h3>
                {product.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{product.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  {product.price && (
                    <span className="font-medium text-gray-700">
                      {Number(product.price).toLocaleString("vi-VN")} {product.currency}
                    </span>
                  )}
                  {product.promotion && <span className="text-green-600">{product.promotion}</span>}
                  {product.category && <span className="bg-gray-100 px-2 py-0.5 rounded-full">{product.category}</span>}
                  {product._count !== undefined && (
                    <span className="text-gray-400">{product._count.videoProjects} video</span>
                  )}
                </div>
              </div>
            </CardBody>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link
                href={`/projects/new?productId=${product.id}`}
                title="Tạo video từ sản phẩm này"
                className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-brand-600 hover:border-brand-300 items-center justify-center text-xs shadow-sm flex"
              >
                +
              </Link>
              <Link
                href={`/products/${product.id}/edit`}
                title="Chỉnh sửa sản phẩm"
                className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 items-center justify-center text-xs shadow-sm flex"
              >
                ✎
              </Link>
              <button
                onClick={() => setDeleteTarget(product)}
                aria-label={`Xóa sản phẩm ${product.name}`}
                className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 items-center justify-center text-sm shadow-sm flex"
              >
                ×
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
