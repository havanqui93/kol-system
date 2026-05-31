"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageSpinner } from "@/components/ui/spinner";

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  accountId: string;
  pageId: string | null;
  pageName: string | null;
  tokenExpiresAt: string | null;
  createdAt: string;
}

const PLATFORMS = [
  {
    id: "tiktok",
    name: "TikTok",
    icon: "🎵",
    color: "bg-black text-white",
    description: "Đăng video lên TikTok của bạn",
    docsUrl: "https://developers.tiktok.com",
    envKeys: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
  },
  {
    id: "facebook",
    name: "Facebook Reels",
    icon: "📘",
    color: "bg-blue-600 text-white",
    description: "Đăng Reels lên Facebook Page của bạn",
    docsUrl: "https://developers.facebook.com",
    envKeys: ["FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET"],
  },
  {
    id: "youtube_shorts",
    name: "YouTube Shorts",
    icon: "▶️",
    color: "bg-red-600 text-white",
    description: "Upload Shorts lên kênh YouTube của bạn",
    docsUrl: "https://console.cloud.google.com",
    envKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  },
] as const;

const ENV_VARS = [
  { key: "ANTHROPIC_API_KEY", label: "Claude AI (Anthropic)", required: true },
  { key: "ELEVENLABS_API_KEY", label: "ElevenLabs TTS", required: true },
  { key: "FAL_KEY", label: "Kling Video (fal.ai)", required: true },
  { key: "R2_ACCESS_KEY_ID", label: "Cloudflare R2", required: true },
  { key: "DATABASE_URL", label: "PostgreSQL DB", required: true },
  { key: "REDIS_URL", label: "Redis", required: true },
  { key: "OPENAI_API_KEY", label: "OpenAI (fallback LLM)", required: false },
];

function EnvStatus() {
  const statuses = ENV_VARS.map((v) => ({
    ...v,
    configured: typeof (process.env as any)[v.key] === "string" && (process.env as any)[v.key] !== "",
  }));

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-gray-800">Trạng thái môi trường</h2>
      </CardHeader>
      <CardBody>
        <div className="space-y-2">
          {statuses.map((v) => (
            <div key={v.key} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-gray-700">{v.label}</span>
                <code className="ml-2 text-xs text-gray-400">{v.key}</code>
              </div>
              <span className={`text-xs font-medium ${v.configured ? "text-green-600" : v.required ? "text-red-600" : "text-gray-400"}`}>
                {v.configured ? "✓ Đã cấu hình" : v.required ? "✗ Chưa cấu hình" : "— Tùy chọn"}
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function StatusMessages() {
  const params = useSearchParams();
  const connected = params.get("connected");
  const error     = params.get("error");

  if (connected) return (
    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
      ✓ Đã kết nối thành công với {PLATFORMS.find((p) => p.id === connected)?.name ?? connected}
    </div>
  );
  if (error) return (
    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
      Kết nối thất bại: {decodeURIComponent(error)}
    </div>
  );
  return null;
}

function PlatformCard({
  platform,
  connectedAccount,
  onConnect,
  onDisconnect,
  connecting,
}: {
  platform: typeof PLATFORMS[number];
  connectedAccount: SocialAccount | undefined;
  onConnect: (id: string) => void;
  onDisconnect: (accountId: string) => Promise<void>;
  connecting: string | null;
}) {
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    if (!connectedAccount) return;
    setDisconnecting(true);
    await onDisconnect(connectedAccount.id);
    setDisconnecting(false);
  }

  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${platform.color}`}>
          {platform.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{platform.name}</span>
            {connectedAccount && <Badge variant="green">Đã kết nối</Badge>}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{platform.description}</p>
          {connectedAccount && (
            <p className="text-xs text-gray-400 mt-1">
              {connectedAccount.pageName
                ? `Page: ${connectedAccount.pageName}`
                : connectedAccount.accountName}
            </p>
          )}
        </div>

        <div className="flex-shrink-0">
          {connectedAccount ? (
            <Button
              variant="danger"
              size="sm"
              loading={disconnecting}
              onClick={handleDisconnect}
            >
              Ngắt kết nối
            </Button>
          ) : (
            <Button
              size="sm"
              loading={connecting === platform.id}
              onClick={() => onConnect(platform.id)}
            >
              Kết nối
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  async function loadAccounts() {
    const res = await fetch("/api/social/accounts", { headers: { "x-user-id": "demo-user" } });
    const json = await res.json();
    setAccounts(json.accounts ?? []);
    setLoading(false);
  }

  useEffect(() => { loadAccounts(); }, []);

  function handleConnect(platformId: string) {
    setConnecting(platformId);
    // Navigate to OAuth — browser will follow redirects to platform then back
    window.location.href = `/api/social/connect/${platformId}`;
  }

  async function handleDisconnect(accountId: string) {
    await fetch(`/api/social/accounts/${accountId}`, {
      method: "DELETE",
      headers: { "x-user-id": "demo-user" },
    });
    await loadAccounts();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-sm text-gray-500 mt-1">Kết nối tài khoản mạng xã hội để đăng video tự động</p>
      </div>

      <Suspense fallback={null}>
        <StatusMessages />
      </Suspense>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Kênh mạng xã hội
        </h2>

        {loading ? (
          <PageSpinner />
        ) : (
          <div className="space-y-3">
            {PLATFORMS.map((platform) => (
              <PlatformCard
                key={platform.id}
                platform={platform}
                connectedAccount={accounts.find((a) => a.platform === platform.id)}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                connecting={connecting}
              />
            ))}
          </div>
        )}
      </div>

      {/* Environment status */}
      <EnvStatus />

      {/* Setup guide */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-800">Hướng dẫn cài đặt API keys</h2>
        </CardHeader>
        <CardBody className="space-y-4 text-sm text-gray-600">
          <p>Trước khi kết nối, bạn cần tạo app trên mỗi nền tảng và thêm keys vào file <code className="bg-gray-100 px-1 rounded">.env.local</code>:</p>

          {PLATFORMS.map((p) => (
            <div key={p.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2 font-medium">
                <span>{p.icon}</span> {p.name}
              </div>
              <ol className="list-decimal list-inside space-y-1 text-gray-500 text-xs">
                <li>Truy cập <a href={p.docsUrl} target="_blank" rel="noreferrer" className="text-brand-600 underline">{p.docsUrl}</a></li>
                <li>Tạo app và lấy credentials</li>
                <li>
                  Thêm vào <code className="bg-gray-100 px-1 rounded">.env.local</code>:{" "}
                  {p.envKeys.map((k) => <code key={k} className="bg-gray-100 px-1 rounded mr-1">{k}</code>)}
                </li>
                <li>
                  Thêm Redirect URI:{" "}
                  <code className="bg-gray-100 px-1 rounded text-xs">
                    {`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/social/callback/${p.id}`}
                  </code>
                </li>
              </ol>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
