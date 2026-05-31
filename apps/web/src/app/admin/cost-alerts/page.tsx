"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";

interface CostAlert {
  projectId: string;
  projectTitle: string | null;
  projectStatus: string;
  totalCostUsd: number;
  budgetLimitUsd: number;
  percentUsed: number;
  exceeded: boolean;
  nearLimit: boolean;
}

export default function CostAlertsPage() {
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [stats, setStats] = useState({ exceeded: 0, nearLimit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/cost-alerts?threshold=80")
      .then((r) => r.json())
      .then((d) => {
        setAlerts(d.alerts ?? []);
        setStats({ exceeded: d.exceeded ?? 0, nearLimit: d.nearLimit ?? 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">Admin</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Cảnh báo ngân sách</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Đã vượt ngân sách", value: stats.exceeded, color: "text-red-600" },
          { label: "Gần đến giới hạn (>80%)", value: stats.nearLimit, color: "text-yellow-600" },
          { label: "Tổng cảnh báo", value: alerts.length, color: "text-gray-900" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </CardBody>
          </Card>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải...</p>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-gray-600 text-sm">Không có dự án nào vượt ngân sách</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.projectId} className={alert.exceeded ? "border-red-200" : "border-yellow-200"}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <Link
                      href={`/projects/${alert.projectId}`}
                      className="font-medium text-sm text-gray-900 hover:text-brand-600"
                    >
                      {alert.projectTitle ?? `Project ${alert.projectId.slice(-8)}`}
                    </Link>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Status: {alert.projectStatus}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${alert.exceeded ? "text-red-600" : "text-yellow-600"}`}>
                      {alert.percentUsed}%
                    </div>
                    <div className="text-xs text-gray-500">
                      ${alert.totalCostUsd.toFixed(4)} / ${alert.budgetLimitUsd.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${alert.exceeded ? "bg-red-500" : "bg-yellow-500"}`}
                    style={{ width: `${Math.min(100, alert.percentUsed)}%` }}
                  />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
