import { prisma } from "@kol/database";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function KolProfilesPage() {
  const profiles = await prisma.kolProfile.findMany({
    where: { userId: "demo-user" },
    include: {
      _count: { select: { videoProjects: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KOL Profiles</h1>
          <p className="mt-1 text-sm text-gray-500">{profiles.length} profile</p>
        </div>
        <Link href="/projects/new">
          <Button>+ Tạo KOL mới</Button>
        </Link>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🎭</div>
          <h2 className="text-xl font-semibold text-gray-700">Chưa có KOL profile nào</h2>
          <p className="text-gray-500 mt-2 mb-6">Tạo video đầu tiên để tự động tạo KOL profile</p>
          <Link href="/projects/new">
            <Button size="lg">Tạo video đầu tiên</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 mb-4">
                {profile.avatarImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarImageUrl}
                    alt={profile.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-100 to-purple-100 flex items-center justify-center text-2xl">
                    🎭
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">
                    {profile.voiceGender} · {profile.voiceStyle} · {profile.language.toUpperCase()}
                  </p>
                </div>
              </div>

              {profile.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{profile.description}</p>
              )}

              {profile.stylePrompt && (
                <p className="text-xs text-gray-400 italic mb-3 line-clamp-1">
                  &ldquo;{profile.stylePrompt}&rdquo;
                </p>
              )}

              <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {profile._count.videoProjects} video
                </span>
                <Link
                  href={`/?kolProfileId=${profile.id}`}
                  className="text-xs text-brand-600 hover:underline"
                >
                  Xem video →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
