"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { Script } from "@/lib/api/client";

function CopyScriptButton({ text, label = "⎘ Sao chép" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      title="Sao chép script"
      className="text-xs text-gray-400 hover:text-brand-600 transition-colors px-1"
    >
      {copied ? "✓ Đã sao chép" : label}
    </button>
  );
}

interface ScriptViewerProps {
  scripts: Script[];
  onApprove: (scriptId: string) => Promise<void>;
  onRegenerate?: () => Promise<void>;
  disabled?: boolean;
  targetDurationSeconds?: number;
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

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function sentenceCount(text: string) {
  return text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
}

function ScriptSection({ emoji, label, text }: { emoji: string; label: string; text: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  const wc = wordCount(text);
  return (
    <div className="flex gap-3 group">
      <span className="text-xl flex-shrink-0 mt-0.5">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</div>
            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{wc} từ</span>
            <span className="text-[10px] text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded-full">{text.length} ký tự</span>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-brand-600 transition-all px-1 flex-shrink-0"
            title={`Sao chép ${label}`}
          >
            {copied ? "✓" : "⎘"}
          </button>
        </div>
        <p className="text-sm text-gray-800 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

export function ScriptViewer({ scripts, onApprove, onRegenerate, disabled, targetDurationSeconds }: ScriptViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [approving, setApproving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [sectionsExpanded, setSectionsExpanded] = useState(true);

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
    <Card className={script.isApproved ? "border-green-300 bg-green-50/20" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Kịch bản</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              ~{script.wordCount ?? SECTION_LABELS.reduce((sum, { key }) => sum + wordCount((script[key] as string | null) ?? ""), 0)} từ
              {" · "}{sentenceCount(script.fullScript)} câu
              {" · "}~{script.estimatedDurationSeconds ?? "?"}s
              {" · "}{script.fullScript.length.toLocaleString()} ký tự
              {" · "}đọc ~{Math.ceil((script.wordCount ?? SECTION_LABELS.reduce((sum, { key }) => sum + wordCount((script[key] as string | null) ?? ""), 0)) / 150)} phút
            </p>
            {targetDurationSeconds && script.estimatedDurationSeconds && (
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      script.estimatedDurationSeconds > targetDurationSeconds * 1.1
                        ? "bg-red-400"
                        : script.estimatedDurationSeconds < targetDurationSeconds * 0.8
                        ? "bg-yellow-400"
                        : "bg-green-400"
                    }`}
                    style={{ width: `${Math.min(100, (script.estimatedDurationSeconds / targetDurationSeconds) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                  {script.estimatedDurationSeconds}s / {targetDurationSeconds}s mục tiêu
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSectionsExpanded((v) => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1"
            title={sectionsExpanded ? "Thu gọn các phần" : "Mở rộng các phần"}
          >
            {sectionsExpanded ? "▲ Thu gọn" : "▼ Mở rộng"}
          </button>
          {scripts.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              {scripts.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedIndex(i)}
                  className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                    i === selectedIndex
                      ? "bg-brand-100 text-brand-700 font-medium"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  v{s.version}
                  {s.isApproved && <span className="text-green-600" title="Đã duyệt">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      {sectionsExpanded && (
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
      )}

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
            <button
              onClick={() => {
                const win = window.open("", "_blank");
                if (!win) return;
                win.document.write(`<html><head><title>Kịch bản</title><style>body{font-family:sans-serif;max-width:600px;margin:40px auto;line-height:1.6}h2{font-size:11px;text-transform:uppercase;color:#888;margin-top:20px}p{margin:0 0 8px}</style></head><body>${SECTION_LABELS.map(({ label, key }) => script[key] ? `<h2>${label}</h2><p>${(script[key] as string).replace(/\n/g, "<br>")}</p>` : "").join("")}</body></html>`);
                win.document.close();
                win.print();
              }}
              title="In kịch bản"
              className="text-xs text-gray-400 hover:text-brand-600 transition-colors px-1"
            >
              🖨
            </button>
            <CopyScriptButton text={SECTION_LABELS.filter(({ key }) => script[key]).map(({ label, key }) => `[${label.toUpperCase()}]\n${script[key] as string}`).join("\n\n")} label="⎘ Sao chép có định dạng" />
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
