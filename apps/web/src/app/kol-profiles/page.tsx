"use client";

import { useEffect, useState, useRef } from "react";
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

const VOICE_STYLE_COLORS: Record<string, string> = {
  energetic: "bg-orange-100 text-orange-700",
  professional: "bg-blue-100 text-blue-700",
  funny: "bg-yellow-100 text-yellow-700",
  calm: "bg-teal-100 text-teal-700",
  authoritative: "bg-purple-100 text-purple-700",
};

const LANGUAGE_FLAGS: Record<string, string> = {
  vi: "🇻🇳",
  en: "🇺🇸",
  zh: "🇨🇳",
  ja: "🇯🇵",
  ko: "🇰🇷",
  th: "🇹🇭",
};

type SortKey = "newest" | "most_videos" | "alpha" | "oldest";

export default function KolProfilesPage() {
  const { success, error: toastError } = useToast();
  const [profiles, setProfiles] = useState<KolProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<KolProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>(() => {
    if (typeof window !== "undefined") return (localStorage.getItem("kol-profiles-sort") as SortKey) ?? "newest";
    return "newest";
  });
  const searchRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/kol-profiles", { headers: { "x-user-id": "demo-user" } });
    const json = await res.json();
    setProfiles(json.kolProfiles ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => { localStorage.setItem("kol-profiles-sort", sort); }, [sort]);

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
          <p className="text-sm text-gray-500 mt-1">
            {loading ? "Đang tải..." : (() => {
              const totalVideos = profiles.reduce((sum, p) => sum + (p._count?.videoProjects ?? 0), 0);
              return `${profiles.length} KOL profile · ${totalVideos} video tổng`;
            })()}
          </p>
          {!loading && profiles.length > 0 && (() => {
            const langCounts = profiles.reduce<Record<string, number>>((acc, p) => {
              acc[p.language] = (acc[p.language] ?? 0) + 1;
              return acc;
            }, {});
            return (
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {Object.entries(langCounts).sort((a, b) => b[1] - a[1]).map(([lang, count]) => (
                  <span key={lang} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {LANGUAGE_FLAGS[lang] ?? ""} {lang.toUpperCase()} {count}
                  </span>
                ))}
              </div>
            );
          })()}
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
      <div className="mb-5 relative">
        <input
          ref={searchRef}
          type="search"
          placeholder="Tìm theo tên KOL... (nhấn / để tìm)"
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

      {search && profiles.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.description ?? "").toLowerCase().includes(search.toLowerCase())).length === 0 && (
        <div className="py-12 text-center text-gray-400">
          <p className="text-sm">Không tìm thấy KOL profile nào cho "<span className="font-medium text-gray-600">{search}</span>"</p>
          <button onClick={() => setSearch("")} className="mt-2 text-xs text-brand-600 hover:underline">Xóa bộ lọc</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(() => {
          const sorted = [...profiles]
            .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description ?? "").toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => {
              if (sort === "most_videos") return (b._count?.videoProjects ?? 0) - (a._count?.videoProjects ?? 0);
              if (sort === "alpha") return a.name.localeCompare(b.name, "vi");
              if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
          const maxVideos = Math.max(0, ...sorted.map((p) => p._count?.videoProjects ?? 0));
          return sorted.map((profile) => {
          const isMostUsed = maxVideos > 0 && (profile._count?.videoProjects ?? 0) === maxVideos;
          return (
          <Card key={profile.id} className={`group relative ${isMostUsed && maxVideos > 1 ? "ring-2 ring-brand-300" : ""}`}>
            {isMostUsed && maxVideos > 1 && (
              <div className="absolute -top-2 -right-2 z-10 text-base" title="KOL được dùng nhiều nhất">👑</div>
            )}
            <CardBody className="flex gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-100 to-purple-100 flex-shrink-0 overflow-hidden">
                <img
                  src={profile.avatarImageUrl}
                  alt={profile.name}
                  loading="lazy"
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
                  <span className={`text-xs px-2 py-0.5 rounded-full ${VOICE_STYLE_COLORS[profile.voiceStyle] ?? "bg-gray-100 text-gray-600"}`}>
                    {VOICE_STYLE_LABELS[profile.voiceStyle] ?? profile.voiceStyle}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {LANGUAGE_FLAGS[profile.language] ?? ""} {profile.language.toUpperCase()}
                  </span>
                  {profile._count !== undefined && (
                    <span className="text-xs text-gray-400 px-2 py-0.5">{profile._count.videoProjects} video</span>
                  )}
                  <span className="text-xs text-gray-300 px-1" title={`Tạo lúc: ${new Date(profile.createdAt).toLocaleDateString("vi-VN")}`}>
                    {(() => { const d = new Date(profile.createdAt); const diff = Date.now() - d.getTime(); const days = Math.floor(diff / 86400000); return days < 1 ? "hôm nay" : days < 7 ? `${days}n trước` : d.toLocaleDateString("vi-VN"); })()}
                  </span>
                </div>
              </div>
            </CardBody>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link
                href={`/projects/new?kolProfileId=${profile.id}`}
                title="Tạo video với KOL này"
                className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-brand-600 hover:border-brand-300 items-center justify-center text-xs shadow-sm flex"
              >
                +
              </Link>
              <Link
                href={`/kol-profiles/${profile.id}/edit`}
                title="Chỉnh sửa KOL profile"
                className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 items-center justify-center text-xs shadow-sm flex"
              >
                ✎
              </Link>
              <button
                onClick={() => setDeleteTarget(profile)}
                aria-label={`Xóa KOL profile ${profile.name}`}
                className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 items-center justify-center text-sm shadow-sm flex"
              >
                ×
              </button>
            </div>
          </Card>
        );
        });
        })()}
      </div>
    </div>
  );
}
