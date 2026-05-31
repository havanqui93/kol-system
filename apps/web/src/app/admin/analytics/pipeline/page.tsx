"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";

interface PipelineData {
  funnelCounts: {
    drafted: number;
    scripted: number;
    audioDone: number;
    rendered: number;
    published: number;
  };
  conversionRates: {
    draftToScript: string;
    scriptToAudio: string;
    audioToRender: string;
    renderToPublish: string;
    overallCompletion: string;
  };
  period: { days: number };
}

export default function PipelineAnalyticsPage() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/pipeline?days=30", { headers: { "x-user-id": "demo-user" } })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">Admin</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Pipeline Analytics</h1>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải...</p>
      ) : !data ? (
        <p className="text-sm text-red-500">Không thể tải dữ liệu</p>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardBody>
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Funnel chuyển đổi ({data.period.days} ngày qua)
              </h2>
              <div className="space-y-3">
                {[
                  { label: "Tổng draft", value: data.funnelCounts.drafted, pct: 100 },
                  { label: "Đã tạo kịch bản", value: data.funnelCounts.scripted, pct: parseFloat(data.conversionRates.draftToScript) },
                  { label: "Đã tạo audio", value: data.funnelCounts.audioDone, pct: parseFloat(data.conversionRates.scriptToAudio) },
                  { label: "Đã render", value: data.funnelCounts.rendered, pct: parseFloat(data.conversionRates.audioToRender) },
                  { label: "Đã đăng", value: data.funnelCounts.published, pct: parseFloat(data.conversionRates.renderToPublish) },
                ].map((step) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-32 text-right">{step.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 relative">
                      <div
                        className="h-3 rounded-full bg-brand-500 transition-all"
                        style={{ width: `${step.pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-24">
                      {step.value} ({step.pct.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Nháp → Kịch bản", value: data.conversionRates.draftToScript },
              { label: "Kịch bản → Audio", value: data.conversionRates.scriptToAudio },
              { label: "Audio → Render", value: data.conversionRates.audioToRender },
              { label: "Render → Đăng", value: data.conversionRates.renderToPublish },
              { label: "Tỷ lệ hoàn thành tổng", value: data.conversionRates.overallCompletion },
            ].map((rate) => (
              <Card key={rate.label}>
                <CardBody>
                  <div className="text-2xl font-bold text-gray-900">{rate.value}%</div>
                  <div className="text-xs text-gray-500 mt-1">{rate.label}</div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
