"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProjectCardSkeleton } from "@/components/ui/skeleton";
import { InlineEdit } from "@/components/project/inline-edit";

interface KolProfile {
  id: string;
  name: string;
  description: string | null;
  avatarImageUrl: string;
  voiceGender: string;
  voiceStyle: string;
  language: string;
  createdAt: string;
  _count?: { videoProjects: number };
}

const VOICE_STYLE_LABELS: Record<string, string> = {
  energetic: "Năng động",
  professional: "Chuyên nghiệp",
  funny: "Hài hước",
  calm: "Bình tĩnh",
  authoritative: "Uy quyền",
};

export default function KolProfilesPage() {
  const { success, error: toastError } = useToast();
  const [profiles, setProfiles] = useState<KolProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<KolProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");

  async function load() {
    const res = await fetch("/api/kol-profiles", { headers: { "x-user-id": "demo-user" } });
    const json = await res.json();
    setProfiles(json.kolProfiles ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/kol-profiles/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "x-user-id": "demo-user" },
      });
      if (!res.ok && res.status !== 204) throw new Error("Xóa thất bại");
      setProfiles((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      success("Đã xóa KOL profile");
    } catch {
      toastError("Xóa thất bại, thử lại sau.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa KOL Profile"
        message={`Xóa "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KOL Profiles</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý avatar AI KOL có thể tái sử dụng</p>
        </div>
        <div className="flex gap-2">
          <Link href="/kol-profiles/new">
            <Button size="sm" variant="secondary">+ Tạo KOL Profile</Button>
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

      {!loading && profiles.length === 0 && (
        <div className="text-center py-24 text-gray-400">
          <div className="text-5xl mb-4">🎭</div>
          <p className="font-medium text-gray-600">Chưa có KOL profile nào</p>
          <p className="text-sm mt-1 mb-6">Tạo profile KOL để tái sử dụng avatar trong nhiều video.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/kol-profiles/new">
              <Button>+ Tạo KOL Profile</Button>
            </Link>
            <Link href="/projects/new">
              <Button variant="secondary">Tạo video mới</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-5">
        <input
          type="search"
          placeholder="Tìm theo tên KOL..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase())).map((profile) => (
          <Card key={profile.id} className="group relative">
            <CardBody className="flex gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-100 to-purple-100 flex-shrink-0 overflow-hidden">
                <img
                  src={profile.avatarImageUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  <InlineEdit
                    value={profile.name}
                    onSave={async (name) => {
                      await fetch(`/api/kol-profiles/${profile.id}/rename`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json", "x-user-id": "demo-user" },
                        body: JSON.stringify({ name }),
                      });
                      setProfiles((prev) => prev.map((p) => p.id === profile.id ? { ...p, name } : p));
                    }}
                  />
                </h3>
                {profile.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{profile.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {profile.voiceGender === "female" ? "Nữ" : "Nam"}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {VOICE_STYLE_LABELS[profile.voiceStyle] ?? profile.voiceStyle}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {profile.language.toUpperCase()}
                  </span>
                  {profile._count !== undefined && (
                    <span className="text-xs text-gray-400 px-2 py-0.5">{profile._count.videoProjects} video</span>
                  )}
                </div>
              </div>
            </CardBody>
            <button
              onClick={() => setDeleteTarget(profile)}
              aria-label={`Xóa KOL profile ${profile.name}`}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-sm flex"
            >
              ×
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
