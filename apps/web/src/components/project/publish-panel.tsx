"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { suggestHashtags } from "@/lib/hashtags";

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  pageName: string | null;
}

interface PublishJob {
  id: string;
  platform: string;
  status: string;
  platformPostId: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  title: string | null;
  createdAt: string;
}

const PLATFORM_META: Record<string, { icon: string; name: string }> = {
  tiktok:        { icon: "🎵", name: "TikTok" },
  facebook:      { icon: "📘", name: "Facebook Reels" },
  youtube_shorts:{ icon: "▶️", name: "YouTube Shorts" },
};

const PUBLISH_STATUS_BADGE: Record<string, { variant: "yellow" | "green" | "red" | "gray"; label: string }> = {
  scheduled:  { variant: "yellow", label: "Đã lên lịch" },
  publishing: { variant: "yellow", label: "Đang đăng..." },
  published:  { variant: "green",  label: "Đã đăng" },
  failed:     { variant: "red",    label: "Thất bại" },
};

interface PublishPanelProps {
  projectId: string;
  disabled: boolean;
  platform?: string;
  videoType?: string;
}

export function PublishPanel({ projectId, disabled, platform = "tiktok", videoType = "product_review" }: PublishPanelProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [publishJobs, setPublishJobs] = useState<PublishJob[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const suggestedTags = suggestHashtags({ platform, videoType, maxTags: 15 });

  async function loadData() {
    const [accountsRes, jobsRes] = await Promise.all([
      fetch("/api/social/accounts", { headers: { "x-user-id": "demo-user" } }),
      fetch(`/api/video-projects/${projectId}/publish`, { headers: { "x-user-id": "demo-user" } }),
    ]);
    const accountsJson = await accountsRes.json();
    const jobsJson     = await jobsRes.json();
    setAccounts(accountsJson.accounts ?? []);
    setPublishJobs(jobsJson.jobs ?? []);
    setLoading(false);

    if (!selectedAccount && accountsJson.accounts?.length > 0) {
      setSelectedAccount(accountsJson.accounts[0].id);
    }
  }

  useEffect(() => { loadData(); }, [projectId]);

  async function handlePublish() {
    if (!selectedAccount) { setError("Chọn tài khoản để đăng"); return; }
    const account = accounts.find((a) => a.id === selectedAccount);
    if (!account) return;

    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/video-projects/${projectId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": "demo-user" },
        body: JSON.stringify({
          platform: account.platform,
          socialAccountId: selectedAccount,
          scheduledAt: scheduledAt || undefined,
          hashtags: hashtags.length > 0 ? hashtags : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Lỗi đăng bài");
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setPublishing(false);
    }
  }

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Đăng lên mạng xã hội</h3>
          <Link href="/settings" className="text-xs text-brand-600 hover:underline">
            Quản lý tài khoản →
          </Link>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* No accounts connected */}
        {accounts.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">Chưa có tài khoản mạng xã hội nào được kết nối.</p>
            <Link href="/settings">
              <Button size="sm" variant="secondary" className="mt-3">
                Kết nối tài khoản
              </Button>
            </Link>
          </div>
        )}

        {/* Account selector */}
        {accounts.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Chọn tài khoản đăng</label>
            <div className="grid gap-2">
              {accounts.map((account) => {
                const meta = PLATFORM_META[account.platform] ?? { icon: "📱", name: account.platform };
                const isSelected = selectedAccount === account.id;
                return (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccount(account.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? "border-brand-400 bg-brand-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <span className="text-xl">{meta.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{meta.name}</div>
                      <div className="text-xs text-gray-500">
                        {account.pageName ?? account.accountName}
                      </div>
                    </div>
                    {isSelected && <span className="ml-auto text-brand-600 text-lg">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Optional schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lên lịch đăng (tùy chọn)
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-gray-400">Để trống để đăng ngay</p>
            </div>

            {/* Hashtag suggestions */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">Hashtag gợi ý</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedTags.map((tag) => {
                  const selected = hashtags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setHashtags((prev) =>
                          selected ? prev.filter((t) => t !== tag) : [...prev, tag]
                        )
                      }
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                        selected
                          ? "bg-brand-100 border-brand-300 text-brand-700"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              {hashtags.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">{hashtags.length} hashtag đã chọn</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button
              onClick={handlePublish}
              loading={publishing}
              disabled={disabled || publishing || !selectedAccount}
              className="w-full"
            >
              {scheduledAt ? "Lên lịch đăng bài" : "Đăng ngay"}
            </Button>
          </div>
        )}

        {/* Publish history */}
        {publishJobs.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Lịch sử đăng</p>
            <div className="space-y-2">
              {publishJobs.map((job) => {
                const meta = PLATFORM_META[job.platform] ?? { icon: "📱", name: job.platform };
                const badge = PUBLISH_STATUS_BADGE[job.status] ?? { variant: "gray" as const, label: job.status };
                return (
                  <div key={job.id} className="flex items-center gap-3 text-sm">
                    <span>{meta.icon}</span>
                    <span className="flex-1 text-gray-700">{meta.name}</span>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    {job.publishedAt && (
                      <span className="text-xs text-gray-400">
                        {new Date(job.publishedAt).toLocaleDateString("vi-VN")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
