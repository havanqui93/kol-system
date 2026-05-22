"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Textarea, Select, FormField } from "@/components/ui/input";
import { api } from "@/lib/api/client";

const VOICE_GENDER_OPTIONS = [
  { value: "female", label: "Nữ" },
  { value: "male", label: "Nam" },
];

const VOICE_STYLE_OPTIONS = [
  { value: "energetic", label: "Năng động" },
  { value: "professional", label: "Chuyên nghiệp" },
  { value: "calm", label: "Bình tĩnh" },
  { value: "funny", label: "Hài hước" },
  { value: "authoritative", label: "Uy quyền" },
];

const LANGUAGE_OPTIONS = [
  { value: "vi", label: "🇻🇳 Tiếng Việt" },
  { value: "en", label: "🇺🇸 English" },
];

export default function NewKolProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    voiceGender: "female",
    voiceStyle: "energetic",
    language: "vi",
    stylePrompt: "young Vietnamese female KOL, friendly, confident, energetic, natural social commerce presenter",
  });

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    } else {
      setAvatarPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Vui lòng nhập tên KOL"); return; }
    if (!avatarFile) { setError("Vui lòng chọn ảnh avatar"); return; }
    setLoading(true);
    setError(null);
    try {
      const imageUpload = await api.uploads.image(avatarFile, "avatar");
      await api.kolProfiles.create({
        name: form.name.trim(),
        description: form.description || undefined,
        avatarImageUrl: imageUpload.url,
        voiceGender: form.voiceGender as "male" | "female",
        voiceStyle: form.voiceStyle as "energetic" | "professional" | "funny" | "calm" | "authoritative",
        language: form.language,
        stylePrompt: form.stylePrompt || undefined,
      });
      router.push("/kol-profiles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tạo KOL Profile mới</h1>
        <p className="text-sm text-gray-500 mt-1">Profile KOL có thể tái sử dụng trong nhiều video</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-800">Avatar & Danh tính</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="flex gap-4 items-start">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border border-gray-200 flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-100 to-purple-100 flex items-center justify-center text-3xl flex-shrink-0">🎭</div>
              )}
              <div className="flex-1">
                <FormField label="Ảnh avatar" htmlFor="avatar" hint="Ảnh chân dung rõ mặt cho kết quả talking-head tốt nhất" required>
                  <Input id="avatar" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} />
                </FormField>
              </div>
            </div>
            <FormField label="Tên KOL" htmlFor="name" required>
              <Input id="name" autoFocus placeholder="Ví dụ: Linh AI, Mai Beauty KOL" value={form.name} onChange={set("name")} />
            </FormField>
            <FormField label="Mô tả" htmlFor="description">
              <Input id="description" placeholder="Ghi chú về phong cách / chuyên môn" value={form.description} onChange={set("description")} />
            </FormField>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-800">Giọng nói & Phong cách</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Giới tính giọng" htmlFor="voiceGender">
                <Select id="voiceGender" options={VOICE_GENDER_OPTIONS} value={form.voiceGender} onChange={set("voiceGender")} />
              </FormField>
              <FormField label="Phong cách giọng" htmlFor="voiceStyle">
                <Select id="voiceStyle" options={VOICE_STYLE_OPTIONS} value={form.voiceStyle} onChange={set("voiceStyle")} />
              </FormField>
            </div>
            <FormField label="Ngôn ngữ" htmlFor="language">
              <Select id="language" options={LANGUAGE_OPTIONS} value={form.language} onChange={set("language")} />
            </FormField>
            <FormField label="Mô tả phong cách Kling (prompt)" htmlFor="stylePrompt" hint="Dùng để hướng dẫn Kling tạo talking-head video">
              <Textarea id="stylePrompt" rows={2} value={form.stylePrompt} onChange={set("stylePrompt")} />
              {form.stylePrompt && (
                <span className="text-xs text-gray-400 mt-0.5 block text-right">{form.stylePrompt.length} ký tự</span>
              )}
            </FormField>
          </CardBody>
        </Card>
        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="flex gap-3">
          <Button type="submit" size="lg" loading={loading} className="flex-1">
            {loading ? "Đang tạo..." : "Tạo KOL Profile"}
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => router.back()} disabled={loading}>Hủy</Button>
        </div>
      </form>
    </div>
  );
}
