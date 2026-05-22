"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Textarea, FormField } from "@/components/ui/input";

interface ProductForm {
  name: string;
  description: string;
  price: string;
  promotion: string;
  category: string;
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>({
    name: "", description: "", price: "", promotion: "", category: "",
  });

  useEffect(() => {
    fetch(`/api/products/${params.id}`, { headers: { "x-user-id": "demo-user" } })
      .then((r) => r.json())
      .then((p) => {
        setForm({
          name: p.name ?? "",
          description: p.description ?? "",
          price: p.price ?? "",
          promotion: p.promotion ?? "",
          category: p.category ?? "",
        });
        setFetching(false);
      })
      .catch(() => { setError("Không tải được sản phẩm"); setFetching(false); });
  }, [params.id]);

  function set(key: keyof ProductForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Tên sản phẩm không được trống"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": "demo-user" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description || undefined,
          price: form.price || undefined,
          promotion: form.promotion || undefined,
          category: form.category || undefined,
        }),
      });
      if (!res.ok) throw new Error("Cập nhật thất bại");
      router.push("/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      setLoading(false);
    }
  }

  if (fetching) return <div className="text-center py-24 text-gray-400">Đang tải...</div>;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700">← Sản phẩm</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-800">Thông tin sản phẩm</h2></CardHeader>
          <CardBody className="space-y-4">
            <FormField label="Tên sản phẩm" htmlFor="name" required>
              <Input id="name" value={form.name} onChange={set("name")} />
            </FormField>
            <FormField label="Mô tả" htmlFor="description">
              <Textarea id="description" rows={3} value={form.description} onChange={set("description")} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Giá bán" htmlFor="price">
                <Input id="price" placeholder="299.000đ" value={form.price} onChange={set("price")} />
              </FormField>
              <FormField label="Khuyến mãi" htmlFor="promotion">
                <Input id="promotion" placeholder="Giảm 30%" value={form.promotion} onChange={set("promotion")} />
              </FormField>
            </div>
            <FormField label="Danh mục" htmlFor="category">
              <Input id="category" placeholder="Mỹ phẩm, Thực phẩm..." value={form.category} onChange={set("category")} />
            </FormField>
          </CardBody>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href="/products"><Button variant="secondary" type="button" disabled={loading}>Hủy</Button></Link>
          <Button type="submit" loading={loading}>Lưu thay đổi</Button>
        </div>
      </form>
    </div>
  );
}
