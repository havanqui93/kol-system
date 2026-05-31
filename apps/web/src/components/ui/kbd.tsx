import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

interface KbdProps extends HTMLAttributes<HTMLElement> {
  keys: string | string[];
}

export function Kbd({ keys, className, ...props }: KbdProps) {
  const keyList = Array.isArray(keys) ? keys : [keys];

  return (
    <span className={clsx("inline-flex items-center gap-0.5", className)} {...props}>
      {keyList.map((key, i) => (
        <kbd
          key={i}
          className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1 text-xs font-mono font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded shadow-[0_1px_0_rgba(0,0,0,0.15)]"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}
