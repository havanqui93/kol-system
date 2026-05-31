import { PLATFORM_LIMITS } from "@/lib/platform-limits";
import { Card, CardBody } from "@/components/ui/card";
import { PlatformBadge } from "@/components/ui/platform-badge";

export const metadata = { title: "Hướng dẫn đăng video theo nền tảng" };

export default function PlatformGuidePage() {
  const platforms = Object.entries(PLATFORM_LIMITS);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hướng dẫn theo nền tảng</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tối ưu video của bạn cho từng mạng xã hội để đạt hiệu quả tốt nhất
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {platforms.map(([platform, limits]) => (
          <Card key={platform}>
            <CardBody>
              <div className="flex items-center gap-3 mb-4">
                <PlatformBadge platform={platform} size="md" />
                <div className="text-xs text-gray-500">
                  {limits.recommendedDurations.join("s, ")}s
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
                {[
                  ["Thời lượng tối đa", `${limits.maxDurationSeconds}s`],
                  ["Thời lượng tối thiểu", `${limits.minDurationSeconds}s`],
                  ["Tiêu đề tối đa", `${limits.maxTitleChars} ký tự`],
                  ["Hashtag tối đa", `${limits.maxHashtags} tags`],
                  ["Tỉ lệ khung hình", limits.aspectRatio],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="text-gray-800 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>

              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Mẹo tối ưu
                </div>
                <ul className="space-y-1">
                  {limits.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                      <span className="text-brand-500 mt-0.5 flex-shrink-0">✓</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
