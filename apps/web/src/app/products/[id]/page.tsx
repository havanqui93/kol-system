"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Textarea, FormField } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  promotion: string | null;
  targetCustomer: string | null;
  category: string | null;
  imageUrls: string[];
}

export default function ProductEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [describing, setDescribing] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", price: "", promotion: "", targetCustomer: "", category: "",
  });

  useEffect(() => {
    fetch(`/api/products/${params.id}`, { headers: { "x-user-id": "demo-user" } })
      .then((r) => r.json())
      .then((data) => {
        setProduct(data);
        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          price: data.price ?? "",
          promotion: data.promotion ?? "",
          targetCustomer: data.targetCustomer ?? "",
          category: data.category ?? "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": "demo-user" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Lỗi lưu");
      success("Đã lưu sản phẩm");
      router.push("/products");
    } catch {
      toastError("Lưu thất bại, thử lại sau");
    } finally {
      setSaving(false);
    }
  }

  async function handleDescribe() {
    setDescribing(true);
    try {
      const res = await fetch(`/api/products/${params.id}/describe`, {
        method: "POST",
        headers: { "x-user-id": "demo-user" },
      });
      if (!res.ok) throw new Error("Lỗi phân tích");
      const data = await res.json();
      setForm((p) => ({ ...p, description: data.description }));
      success("Đã tạo mô tả từ ảnh");
    } catch {
      toastError("Không thể phân tích ảnh");
    } finally {
      setDescribing(false);
    }
  }

  if (loading) return <div className="text-gray-400 py-12 text-center">Đang tải...</div>;
  if (!product) return <div className="text-red-600 py-12 text-center">Không tìm thấy sản phẩm</div>;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700">← Sản phẩm</Link>
        <h1 className="text-xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              {product.imageUrls[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrls[0]} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
              )}
              <h2 className="font-semibold text-gray-800">{product.name}</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <FormField label="Tên sản phẩm" htmlFor="name" required>
              <Input id="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </FormField>

            <FormField label="Mô tả" htmlFor="description">
              <div className="space-y-2">
                <Textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
                {product.imageUrls.length > 0 && (
                  <Button type="button" size="sm" variant="ghost" loading={describing} onClick={handleDescribe}>
                    ✨ Tự động mô tả từ ảnh (Claude Vision)
                  </Button>
                )}
              </div>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Giá bán" htmlFor="price">
                <Input id="price" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
              </FormField>
              <FormField label="Khuyến mãi" htmlFor="promotion">
                <Input id="promotion" value={form.promotion} onChange={(e) => setForm((p) => ({ ...p, promotion: e.target.value }))} />
              </FormField>
            </div>

            <FormField label="Khách hàng mục tiêu" htmlFor="targetCustomer">
              <Input id="targetCustomer" value={form.targetCustomer} onChange={(e) => setForm((p) => ({ ...p, targetCustomer: e.target.value }))} />
            </FormField>

            <FormField label="Danh mục" htmlFor="category">
              <Input id="category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Ví dụ: Mỹ phẩm, Thực phẩm..." />
            </FormField>
          </CardBody>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={saving} className="flex-1">Lưu thay đổi</Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/products")}>Hủy</Button>
        </div>
      </form>
    </div>
  );
}
