"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Textarea, Select, FormField } from "@/components/ui/input";

interface ProfileForm {
  name: string;
  description: string;
  voiceGender: string;
  voiceStyle: string;
  language: string;
  stylePrompt: string;
}

const VOICE_STYLE_OPTIONS = [
  { value: "energetic", label: "Năng động" },
  { value: "professional", label: "Chuyên nghiệp" },
  { value: "funny", label: "Hài hước" },
  { value: "calm", label: "Bình tĩnh" },
  { value: "authoritative", label: "Uy quyền" },
];

export default function EditKolProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [form, setForm] = useState<ProfileForm>({
    name: "", description: "", voiceGender: "female", voiceStyle: "energetic", language: "vi", stylePrompt: "",
  });

  useEffect(() => {
    fetch(`/api/kol-profiles/${params.id}`, { headers: { "x-user-id": "demo-user" } })
      .then((r) => r.json())
      .then((p) => {
        setAvatarUrl(p.avatarImageUrl ?? "");
        setForm({
          name: p.name ?? "",
          description: p.description ?? "",
          voiceGender: p.voiceGender ?? "female",
          voiceStyle: p.voiceStyle ?? "energetic",
          language: p.language ?? "vi",
          stylePrompt: p.stylePrompt ?? "",
        });
        setFetching(false);
      })
      .catch(() => { setError("Không tải được KOL profile"); setFetching(false); });
  }, [params.id]);

  function set(key: keyof ProfileForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Tên KOL không được trống"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/kol-profiles/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": "demo-user" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description || undefined,
          voiceGender: form.voiceGender,
          voiceStyle: form.voiceStyle,
          language: form.language,
          stylePrompt: form.stylePrompt || undefined,
        }),
      });
      if (!res.ok) throw new Error("Cập nhật thất bại");
      router.push("/kol-profiles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      setLoading(false);
    }
  }

  if (fetching) return <div className="text-center py-24 text-gray-400">Đang tải...</div>;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/kol-profiles" className="text-sm text-gray-500 hover:text-gray-700">← KOL Profiles</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Chỉnh sửa KOL Profile</h1>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

      {avatarUrl && (
        <div className="mb-4 flex items-center gap-3">
          <img src={avatarUrl} alt={form.name} className="w-16 h-16 rounded-full object-cover border border-gray-200" />
          <p className="text-xs text-gray-400">Avatar hiện tại (không thể thay đổi ảnh)</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-800">Thông tin KOL</h2></CardHeader>
          <CardBody className="space-y-4">
            <FormField label="Tên KOL" htmlFor="name" required>
              <Input id="name" autoFocus value={form.name} onChange={set("name")} />
            </FormField>
            <FormField label="Mô tả" htmlFor="description">
              <Textarea id="description" rows={2} value={form.description} onChange={set("description")} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Giới tính giọng" htmlFor="voiceGender">
                <Select
                  id="voiceGender"
                  value={form.voiceGender}
                  onChange={set("voiceGender")}
                  options={[{ value: "female", label: "Nữ" }, { value: "male", label: "Nam" }]}
                />
              </FormField>
              <FormField label="Phong cách" htmlFor="voiceStyle">
                <Select
                  id="voiceStyle"
                  value={form.voiceStyle}
                  onChange={set("voiceStyle")}
                  options={VOICE_STYLE_OPTIONS}
                />
              </FormField>
            </div>
            <FormField label="Ngôn ngữ" htmlFor="language">
              <Select
                id="language"
                value={form.language}
                onChange={set("language")}
                options={[{ value: "vi", label: "🇻🇳 Tiếng Việt" }, { value: "en", label: "🇺🇸 English" }]}
              />
            </FormField>
            <FormField label="Style prompt (tùy chọn)" htmlFor="stylePrompt" hint="Mô tả phong cách avatar cho AI">
              <Textarea id="stylePrompt" rows={2} value={form.stylePrompt} onChange={set("stylePrompt")} />
              {form.stylePrompt && (
                <span className="text-xs text-gray-400 mt-0.5 block text-right">{form.stylePrompt.length} ký tự</span>
              )}
            </FormField>
          </CardBody>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href="/kol-profiles"><Button variant="secondary" type="button" disabled={loading}>Hủy</Button></Link>
          <Button type="submit" loading={loading}>Lưu thay đổi</Button>
        </div>
      </form>
    </div>
  );
}
