"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { Script } from "@/lib/api/client";

interface ScriptViewerProps {
  scripts: Script[];
  onApprove: (scriptId: string) => Promise<void>;
  onRegenerate?: (feedback?: string) => Promise<void>;
  disabled?: boolean;
}

const SECTION_LABELS: { key: keyof Script; label: string; emoji: string }[] = [
  { key: "hook", label: "Hook", emoji: "🪝" },
  { key: "problem", label: "Vấn đề", emoji: "😫" },
  { key: "introduction", label: "Giới thiệu sản phẩm", emoji: "📦" },
  { key: "benefits", label: "Lợi ích", emoji: "✅" },
  { key: "proof", label: "Bằng chứng", emoji: "🏆" },
  { key: "offer", label: "Ưu đãi", emoji: "🎁" },
  { key: "cta", label: "Kêu gọi hành động", emoji: "📣" },
];

function ScriptSection({ emoji, label, text }: { emoji: string; label: string; text: string | null }) {
  if (!text) return null;
  return (
    <div className="flex gap-3">
      <span className="text-xl flex-shrink-0 mt-0.5">{emoji}</span>
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</div>
        <p className="text-sm text-gray-800 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

export function ScriptViewer({ scripts, onApprove, onRegenerate, disabled }: ScriptViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [approving, setApproving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [compareMode, setCompareMode] = useState(false);

  const script = scripts[selectedIndex];
  if (!script) return null;

  const compareScript = compareMode && scripts.length >= 2
    ? scripts[selectedIndex === 0 ? 1 : 0]
    : null;

  async function handleApprove() {
    if (!script) return;
    setApproving(true);
    try {
      await onApprove(script.id);
    } finally {
      setApproving(false);
    }
  }

  async function handleRegenerate() {
    if (!onRegenerate) return;
    setRegenerating(true);
    setShowFeedback(false);
    try {
      await onRegenerate(feedback.trim() || undefined);
      setFeedback("");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Kịch bản</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              ~{script.wordCount ?? "?"} từ · ~{script.estimatedDurationSeconds ?? "?"}s
            </p>
          </div>
          <div className="flex items-center gap-2">
            {scripts.length > 1 && (
              <div className="flex gap-1">
                {scripts.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedIndex(i); setCompareMode(false); }}
                    className={`text-xs px-2 py-1 rounded ${i === selectedIndex ? "bg-brand-100 text-brand-700 font-medium" : "text-gray-500 hover:bg-gray-100"}`}
                  >
                    v{s.version}
                  </button>
                ))}
                <button
                  onClick={() => setCompareMode((v) => !v)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${compareMode ? "bg-purple-100 text-purple-700 font-medium" : "text-gray-500 hover:bg-gray-100"}`}
                  title="So sánh 2 phiên bản"
                >
                  ⇆ So sánh
                </button>
              </div>
            )}
            {onRegenerate && !script.isApproved && (
              <button
                onClick={() => setShowFeedback((v) => !v)}
                disabled={disabled || regenerating}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              >
                ↺ Viết lại
              </button>
            )}
          </div>
        </div>

        {/* Feedback input for regeneration */}
        {showFeedback && onRegenerate && (
          <div className="mt-3 space-y-2">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Nhập phản hồi để AI cải thiện kịch bản (tùy chọn)..."
              rows={2}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                loading={regenerating}
                onClick={handleRegenerate}
                disabled={disabled || regenerating}
              >
                Viết lại kịch bản
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowFeedback(false)}
                disabled={regenerating}
              >
                Hủy
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardBody className="space-y-4">
        {compareScript ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-brand-700 mb-3 uppercase tracking-wide">
                Phiên bản v{script.version} (đang chọn)
              </div>
              <div className="space-y-4">
                {SECTION_LABELS.map(({ key, label, emoji }) => (
                  <ScriptSection key={key} emoji={emoji} label={label} text={script[key] as string | null} />
                ))}
              </div>
            </div>
            <div className="border-l border-gray-100 pl-4">
              <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                Phiên bản v{compareScript.version}
              </div>
              <div className="space-y-4">
                {SECTION_LABELS.map(({ key, label, emoji }) => {
                  const aText = script[key] as string | null;
                  const bText = compareScript[key] as string | null;
                  const changed = aText !== bText;
                  return (
                    <div key={key} className={changed ? "bg-yellow-50 -mx-1 px-1 rounded" : ""}>
                      <ScriptSection emoji={emoji} label={label} text={bText} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          SECTION_LABELS.map(({ key, label, emoji }) => (
            <ScriptSection
              key={key}
              emoji={emoji}
              label={label}
              text={script[key] as string | null}
            />
          ))
        )}
      </CardBody>

      <div className="px-6 pb-4 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-3">
          {script.isApproved ? (
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <span>✓</span> Kịch bản đã được duyệt
            </div>
          ) : (
            <Button
              onClick={handleApprove}
              loading={approving}
              disabled={disabled || approving}
            >
              Duyệt kịch bản này
            </Button>
          )}

          <div className="ml-auto">
            <details>
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Xem full script</summary>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto scrollbar-thin">
                {script.fullScript}
              </div>
            </details>
          </div>
        </div>
      </div>
    </Card>
  );
}
