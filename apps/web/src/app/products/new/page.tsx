"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Textarea, FormField } from "@/components/ui/input";
import { api } from "@/lib/api/client";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    promotion: "",
    targetCustomer: "",
    category: "",
  });

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Vui lòng nhập tên sản phẩm"); return; }
    setLoading(true);
    setError(null);
    try {
      const imageUpload = imageFile ? await api.uploads.image(imageFile, "product") : null;
      await api.products.create({
        name: form.name.trim(),
        description: form.description || undefined,
        price: form.price || undefined,
        promotion: form.promotion || undefined,
        targetCustomer: form.targetCustomer || undefined,
        category: form.category || undefined,
        imageUrls: imageUpload ? [imageUpload.url] : [],
      });
      router.push("/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Thêm sản phẩm mới</h1>
        <p className="text-sm text-gray-500 mt-1">Sản phẩm có thể tái sử dụng trong nhiều video</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-800">Thông tin sản phẩm</h2></CardHeader>
          <CardBody className="space-y-4">
            <FormField label="Tên sản phẩm" htmlFor="name" required>
              <Input id="name" autoFocus placeholder="Ví dụ: Serum Vitamin C" value={form.name} onChange={set("name")} />
            </FormField>
            <FormField label="Mô tả" htmlFor="description">
              <Textarea id="description" rows={3} placeholder="Tính năng, thành phần, lợi ích..." value={form.description} onChange={set("description")} />
              {form.description && (
                <span className="text-xs text-gray-400 mt-0.5 block text-right">{form.description.length} ký tự</span>
              )}
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Giá bán" htmlFor="price">
                <Input id="price" placeholder="299.000đ" value={form.price} onChange={set("price")} />
              </FormField>
              <FormField label="Khuyến mãi" htmlFor="promotion">
                <Input id="promotion" placeholder="Giảm 30% hôm nay" value={form.promotion} onChange={set("promotion")} />
              </FormField>
            </div>
            <FormField label="Danh mục" htmlFor="category">
              <Input id="category" placeholder="Mỹ phẩm, Thực phẩm, Thời trang..." value={form.category} onChange={set("category")} />
            </FormField>
            <FormField label="Khách hàng mục tiêu" htmlFor="targetCustomer">
              <Input id="targetCustomer" placeholder="Phụ nữ 25-40 tuổi..." value={form.targetCustomer} onChange={set("targetCustomer")} />
            </FormField>
            <FormField label="Ảnh sản phẩm" htmlFor="productImage" hint="PNG, JPG, WebP — dùng để tạo B-roll video">
              <div className="flex items-start gap-3">
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                )}
                <Input
                  id="productImage"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setImageFile(file);
                    if (file) setImagePreview(URL.createObjectURL(file));
                    else setImagePreview(null);
                  }}
                />
              </div>
            </FormField>
          </CardBody>
        </Card>
        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="flex gap-3">
          <Button type="submit" size="lg" loading={loading} className="flex-1">
            {loading ? "Đang lưu..." : "Lưu sản phẩm"}
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => router.back()} disabled={loading}>Hủy</Button>
        </div>
      </form>
    </div>
  );
}
