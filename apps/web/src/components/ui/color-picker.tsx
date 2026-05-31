"use client";

import { useState } from "react";
import { PRESET_BRAND_COLORS, isValidHexColor, getContrastColor } from "@/lib/colors";
import { clsx } from "clsx";

interface ColorPickerProps {
  value?: string;
  onChange: (hex: string) => void;
  label?: string;
  className?: string;
}

export function ColorPicker({ value, onChange, label = "Màu thương hiệu", className }: ColorPickerProps) {
  const [customHex, setCustomHex] = useState(value ?? "#7c3aed");

  return (
    <div className={clsx("space-y-2", className)}>
      {label && (
        <label className="block text-xs font-medium text-gray-700">{label}</label>
      )}

      {/* Preset colors */}
      <div className="flex flex-wrap gap-2">
        {PRESET_BRAND_COLORS.map((color) => (
          <button
            key={color.hex}
            type="button"
            title={color.name}
            onClick={() => { onChange(color.hex); setCustomHex(color.hex); }}
            className={clsx(
              "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
              value === color.hex ? "border-gray-800 scale-110" : "border-white shadow-sm"
            )}
            style={{ backgroundColor: color.hex }}
            aria-label={color.name}
            aria-pressed={value === color.hex}
          />
        ))}
      </div>

      {/* Custom color input */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={customHex}
          onChange={(e) => {
            setCustomHex(e.target.value);
            if (isValidHexColor(e.target.value)) onChange(e.target.value);
          }}
          className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0"
        />
        <input
          type="text"
          value={customHex}
          onChange={(e) => {
            const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
            setCustomHex(v);
            if (isValidHexColor(v)) onChange(v);
          }}
          placeholder="#7c3aed"
          maxLength={7}
          className="text-xs border border-gray-300 rounded px-2 py-1 w-24 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {isValidHexColor(customHex) && (
          <span
            className="text-xs px-2 py-0.5 rounded font-medium"
            style={{ backgroundColor: customHex, color: getContrastColor(customHex) }}
          >
            Preview
          </span>
        )}
      </div>
    </div>
  );
}
