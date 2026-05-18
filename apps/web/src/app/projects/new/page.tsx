"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Textarea, Select, FormField } from "@/components/ui/input";
import { api } from "@/lib/api/client";

const PLATFORM_OPTIONS = [
  { value: "tiktok", label: "🎵 TikTok" },
  { value: "facebook", label: "📘 Facebook Reels" },
  { value: "instagram", label: "📸 Instagram Reels" },
  { value: "youtube_shorts", label: "▶️ YouTube Shorts" },
];

const VIDEO_TYPE_OPTIONS = [
  { value: "product_review", label: "Review sản phẩm" },
  { value: "affiliate", label: "Affiliate / Giới thiệu sản phẩm" },
  { value: "used_car", label: "Bán xe ô tô cũ" },
  { value: "virtual_kol", label: "KOL ảo nói chuyện" },
  { value: "b_roll", label: "B-roll / Quảng cáo" },
];

const DURATION_OPTIONS = [
  { value: "15", label: "15 giây" },
  { value: "30", label: "30 giây" },
  { value: "45", label: "45 giây" },
  { value: "60", label: "60 giây" },
];

const LANGUAGE_OPTIONS = [
  { value: "vi", label: "🇻🇳 Tiếng Việt" },
  { value: "en", label: "🇺🇸 English" },
];

const QUALITY_OPTIONS = [
  { value: "cheap", label: "Tiết kiệm - 1 Kling clip" },
  { value: "balanced", label: "Cân bằng - 2 Kling clips" },
  { value: "premium", label: "Premium - 3 Kling clips" },
];

interface FormState {
  title: string;
  videoType: string;
  platform: string;
  durationSeconds: string;
  qualityPreset: string;
  language: string;
  brandTone: string;
  productName: string;
  productDescription: string;
  productPrice: string;
  productPromotion: string;
  targetCustomer: string;
  kolName: string;
  kolStylePrompt: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [avatarImage, setAvatarImage] = useState<File | null>(null);

  const [form, setForm] = useState<FormState>({
    title: "",
    videoType: "product_review",
    platform: "tiktok",
    durationSeconds: "30",
    qualityPreset: "balanced",
    language: "vi",
    brandTone: "",
    productName: "",
    productDescription: "",
    productPrice: "",
    productPromotion: "",
    targetCustomer: "",
    kolName: "AI Girl KOL",
    kolStylePrompt: "young Vietnamese female KOL, friendly, confident, energetic, natural social commerce presenter",
  });

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.productName.trim()) {
      setError("Vui lòng nhập tên sản phẩm");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [productImageUpload, avatarImageUpload] = await Promise.all([
        productImage ? api.uploads.image(productImage, "product") : Promise.resolve(null),
        avatarImage ? api.uploads.image(avatarImage, "avatar") : Promise.resolve(null),
      ]);

      const product = await api.products.create({
        name: form.productName.trim(),
        description: form.productDescription || undefined,
        price: form.productPrice || undefined,
        promotion: form.productPromotion || undefined,
        targetCustomer: form.targetCustomer || undefined,
        imageUrls: productImageUpload ? [productImageUpload.url] : [],
      });

      const kolProfile = avatarImageUpload
        ? await api.kolProfiles.create({
            name: form.kolName.trim() || "AI Girl KOL",
            description: "Uploaded avatar for virtual KOL video generation",
            avatarImageUrl: avatarImageUpload.url,
            voiceGender: "female",
            voiceStyle: "energetic",
            language: form.language,
            stylePrompt: form.kolStylePrompt || undefined,
          })
        : null;

      // 1. Create the project with real product/avatar inputs
      const project = await api.projects.create({
        title: form.title || undefined,
        videoType: form.videoType,
        platform: form.platform,
        durationSeconds: Number(form.durationSeconds),
        qualityPreset: form.qualityPreset as "cheap" | "balanced" | "premium",
        language: form.language,
        brandTone: form.brandTone || undefined,
        productId: product.id,
        kolProfileId: kolProfile?.id,
      });

      // 2. Kick off script generation immediately
      await api.script.generate(project.id);

      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tạo video mới</h1>
        <p className="text-sm text-gray-500 mt-1">Nhập thông tin sản phẩm để AI tạo kịch bản và video</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product info */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-800">Thông tin sản phẩm</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <FormField label="Tên sản phẩm" htmlFor="productName" required>
              <Input
                id="productName"
                placeholder="Ví dụ: Serum dưỡng da Vitamin C"
                value={form.productName}
                onChange={set("productName")}
              />
            </FormField>

            <FormField label="Mô tả sản phẩm" htmlFor="productDescription">
              <Textarea
                id="productDescription"
                placeholder="Mô tả tính năng, thành phần, lợi ích chính..."
                rows={3}
                value={form.productDescription}
                onChange={set("productDescription")}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Giá bán" htmlFor="productPrice">
                <Input
                  id="productPrice"
                  placeholder="Ví dụ: 299.000đ"
                  value={form.productPrice}
                  onChange={set("productPrice")}
                />
              </FormField>

              <FormField label="Khuyến mãi" htmlFor="productPromotion">
                <Input
                  id="productPromotion"
                  placeholder="Ví dụ: Giảm 30% hôm nay"
                  value={form.productPromotion}
                  onChange={set("productPromotion")}
                />
              </FormField>
            </div>

            <FormField label="Khách hàng mục tiêu" htmlFor="targetCustomer">
              <Input
                id="targetCustomer"
                placeholder="Ví dụ: Phụ nữ 25-40 tuổi, quan tâm đến dưỡng da"
                value={form.targetCustomer}
                onChange={set("targetCustomer")}
              />
            </FormField>

            <FormField label="Ảnh sản phẩm" htmlFor="productImage" hint="Dùng để tạo product motion/B-roll bằng Kling.">
              <Input
                id="productImage"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setProductImage(e.target.files?.[0] ?? null)}
              />
            </FormField>
          </CardBody>
        </Card>

        {/* KOL avatar */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-800">KOL avatar</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <FormField label="Ảnh avatar cô gái" htmlFor="avatarImage" hint="Ảnh chân dung rõ mặt sẽ cho talking-head clip tốt hơn.">
              <Input
                id="avatarImage"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setAvatarImage(e.target.files?.[0] ?? null)}
              />
            </FormField>

            <FormField label="Tên KOL" htmlFor="kolName">
              <Input
                id="kolName"
                placeholder="Ví dụ: Linh AI"
                value={form.kolName}
                onChange={set("kolName")}
              />
            </FormField>

            <FormField label="Phong cách avatar" htmlFor="kolStylePrompt">
              <Textarea
                id="kolStylePrompt"
                rows={2}
                value={form.kolStylePrompt}
                onChange={set("kolStylePrompt")}
              />
            </FormField>
          </CardBody>
        </Card>

        {/* Video settings */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-800">Cài đặt video</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <FormField label="Tiêu đề dự án (tùy chọn)" htmlFor="title">
              <Input
                id="title"
                placeholder="Để trống để tự động đặt tên"
                value={form.title}
                onChange={set("title")}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Loại video" htmlFor="videoType">
                <Select
                  id="videoType"
                  options={VIDEO_TYPE_OPTIONS}
                  value={form.videoType}
                  onChange={set("videoType")}
                />
              </FormField>

              <FormField label="Nền tảng" htmlFor="platform">
                <Select
                  id="platform"
                  options={PLATFORM_OPTIONS}
                  value={form.platform}
                  onChange={set("platform")}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Thời lượng" htmlFor="duration">
                <Select
                  id="duration"
                  options={DURATION_OPTIONS}
                  value={form.durationSeconds}
                  onChange={set("durationSeconds")}
                />
              </FormField>

              <FormField label="Ngôn ngữ" htmlFor="language">
                <Select
                  id="language"
                  options={LANGUAGE_OPTIONS}
                  value={form.language}
                  onChange={set("language")}
                />
              </FormField>
            </div>

            <FormField
              label="Chất lượng / chi phí"
              htmlFor="qualityPreset"
              hint="Điều khiển số clip Kling sinh ra để giữ chi phí dự đoán được."
            >
              <Select
                id="qualityPreset"
                options={QUALITY_OPTIONS}
                value={form.qualityPreset}
                onChange={set("qualityPreset")}
              />
            </FormField>

            <FormField
              label="Phong cách thương hiệu (tùy chọn)"
              htmlFor="brandTone"
              hint='Ví dụ: "trẻ trung, năng động" hoặc "sang trọng, tin cậy"'
            >
              <Input
                id="brandTone"
                placeholder="Mô tả tone & mood thương hiệu..."
                value={form.brandTone}
                onChange={set("brandTone")}
              />
            </FormField>
          </CardBody>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" size="lg" loading={loading} className="flex-1">
            {loading ? "Đang tạo kịch bản..." : "Tạo video & Bắt đầu"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => router.back()}
            disabled={loading}
          >
            Hủy
          </Button>
        </div>
      </form>
    </div>
  );
}
