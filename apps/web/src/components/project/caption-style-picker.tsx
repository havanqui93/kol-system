"use client";

import { clsx } from "clsx";

type CaptionStyle = "minimal" | "bold" | "pop" | "outline" | "neon";

interface CaptionStylePickerProps {
  value?: CaptionStyle;
  onChange: (style: CaptionStyle) => void;
  className?: string;
}

const STYLES: { id: CaptionStyle; label: string; description: string; preview: string; className: string }[] = [
  {
    id: "minimal",
    label: "Minimal",
    description: "Chữ trắng, nền tối mờ",
    preview: "Sản phẩm tuyệt vời",
    className: "text-white bg-black/40 font-normal",
  },
  {
    id: "bold",
    label: "Bold",
    description: "Chữ đậm, dễ đọc",
    preview: "Sản phẩm tuyệt vời",
    className: "text-white font-black tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]",
  },
  {
    id: "pop",
    label: "Pop",
    description: "Nền màu thương hiệu",
    preview: "Sản phẩm tuyệt vời",
    className: "text-white bg-brand-600 font-semibold px-2 py-0.5 rounded",
  },
  {
    id: "outline",
    label: "Outline",
    description: "Chữ có viền đen",
    preview: "Sản phẩm tuyệt vời",
    className: "text-white font-bold [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]",
  },
  {
    id: "neon",
    label: "Neon",
    description: "Chữ phát sáng",
    preview: "Sản phẩm tuyệt vời",
    className: "text-cyan-300 font-bold [text-shadow:_0_0_10px_rgba(0,255,255,0.8)]",
  },
];

export function CaptionStylePicker({ value = "minimal", onChange, className = "" }: CaptionStylePickerProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-xs font-medium text-gray-700">Kiểu phụ đề</label>
      <div className="grid grid-cols-1 gap-2">
        {STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => onChange(style.id)}
            className={clsx(
              "flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
              value === style.id
                ? "border-brand-500 bg-brand-50"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            {/* Preview */}
            <div className="w-32 h-7 bg-gray-800 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
              <span className={clsx("text-[10px]", style.className)}>
                {style.preview}
              </span>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-800">{style.label}</div>
              <div className="text-xs text-gray-500">{style.description}</div>
            </div>
            {value === style.id && (
              <span className="ml-auto text-brand-600 text-xs">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
