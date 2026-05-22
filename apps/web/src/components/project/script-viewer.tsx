"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { Script } from "@/lib/api/client";

function CopyScriptButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      title="Sao chép full script"
      className="text-xs text-gray-400 hover:text-brand-600 transition-colors px-1"
    >
      {copied ? "✓ Đã sao chép" : "⎘ Sao chép"}
    </button>
  );
}

interface ScriptViewerProps {
  scripts: Script[];
  onApprove: (scriptId: string) => Promise<void>;
  onRegenerate?: () => Promise<void>;
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

  const script = scripts[selectedIndex];
  if (!script) return null;

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
    try {
      await onRegenerate();
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
              ~{script.wordCount ?? "?"} từ · ~{script.estimatedDurationSeconds ?? "?"}s · {script.fullScript.length.toLocaleString()} ký tự
            </p>
          </div>
          {scripts.length > 1 && (
            <div className="flex gap-1">
              {scripts.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedIndex(i)}
                  className={`text-xs px-2 py-1 rounded ${i === selectedIndex ? "bg-brand-100 text-brand-700 font-medium" : "text-gray-500 hover:bg-gray-100"}`}
                >
                  v{s.version}
                </button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {SECTION_LABELS.map(({ key, label, emoji }) => (
          <ScriptSection
            key={key}
            emoji={emoji}
            label={label}
            text={script[key] as string | null}
          />
        ))}
      </CardBody>

      <div className="px-6 pb-4 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-3">
          {script.isApproved ? (
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <span>✓</span> Kịch bản đã được duyệt
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleApprove}
                loading={approving}
                disabled={disabled || approving || regenerating}
              >
                Duyệt kịch bản này
              </Button>
              {onRegenerate && (
                <Button
                  variant="secondary"
                  onClick={handleRegenerate}
                  loading={regenerating}
                  disabled={disabled || approving || regenerating}
                >
                  Tạo lại
                </Button>
              )}
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <CopyScriptButton text={script.fullScript} />
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
