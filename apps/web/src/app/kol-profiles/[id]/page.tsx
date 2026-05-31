"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Textarea, FormField } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface KolProfile {
  id: string;
  name: string;
  description: string | null;
  avatarImageUrl: string;
  voiceGender: string;
  voiceStyle: string;
  voiceId: string | null;
  language: string;
  stylePrompt: string | null;
}

const VOICE_STYLE_OPTIONS = [
  { value: "energetic", label: "Năng động" },
  { value: "professional", label: "Chuyên nghiệp" },
  { value: "calm", label: "Bình tĩnh" },
  { value: "funny", label: "Hài hước" },
  { value: "authoritative", label: "Uy quyền" },
];

export default function KolProfileEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [profile, setProfile] = useState<KolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", voiceStyle: "energetic", stylePrompt: "" });

  useEffect(() => {
    fetch(`/api/kol-profiles/${params.id}`, { headers: { "x-user-id": "demo-user" } })
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          voiceStyle: data.voiceStyle ?? "energetic",
          stylePrompt: data.stylePrompt ?? "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/kol-profiles/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": "demo-user" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Lỗi lưu");
      success("Đã lưu KOL profile");
      router.push("/kol-profiles");
    } catch {
      toastError("Lưu thất bại, thử lại sau");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-gray-400 py-12 text-center">Đang tải...</div>;
  if (!profile) return <div className="text-red-600 py-12 text-center">Không tìm thấy KOL profile</div>;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/kol-profiles" className="text-sm text-gray-500 hover:text-gray-700">← KOL Profiles</Link>
        <h1 className="text-xl font-bold text-gray-900">Chỉnh sửa KOL</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              {profile.avatarImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarImageUrl} alt={profile.name} className="w-16 h-16 rounded-full object-cover" />
              )}
              <div>
                <h2 className="font-semibold text-gray-800">{profile.name}</h2>
                <p className="text-xs text-gray-500 capitalize">{profile.voiceGender} · {profile.language}</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <FormField label="Tên KOL" htmlFor="name" required>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </FormField>

            <FormField label="Mô tả" htmlFor="description">
              <Textarea
                id="description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </FormField>

            <FormField label="Phong cách giọng nói" htmlFor="voiceStyle">
              <select
                id="voiceStyle"
                value={form.voiceStyle}
                onChange={(e) => setForm((p) => ({ ...p, voiceStyle: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {VOICE_STYLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Style prompt cho Kling" htmlFor="stylePrompt">
              <Textarea
                id="stylePrompt"
                rows={2}
                placeholder="Ví dụ: young Vietnamese female KOL, friendly, energetic..."
                value={form.stylePrompt}
                onChange={(e) => setForm((p) => ({ ...p, stylePrompt: e.target.value }))}
              />
            </FormField>
          </CardBody>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={saving} className="flex-1">Lưu thay đổi</Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/kol-profiles")}>Hủy</Button>
        </div>
      </form>
    </div>
  );
}
