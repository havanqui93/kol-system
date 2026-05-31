"use client";

import { useClipboard } from "@/hooks/use-clipboard";
import { Button } from "./button";
import type { ButtonHTMLAttributes } from "react";

interface CopyButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  text: string;
  label?: string;
  copiedLabel?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "ghost";
}

export function CopyButton({
  text,
  label = "Sao chép",
  copiedLabel = "✓ Đã sao chép",
  size = "sm",
  variant = "outline",
  ...props
}: CopyButtonProps) {
  const { copy, copied } = useClipboard();

  return (
    <Button
      size={size}
      variant={variant}
      onClick={() => copy(text)}
      {...props}
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}
