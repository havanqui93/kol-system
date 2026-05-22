import { clsx } from "clsx";

interface ProgressBarProps {
  value?: number; // 0-100; undefined = indeterminate
  className?: string;
  label?: string;
}

export function ProgressBar({ value, className, label }: ProgressBarProps) {
  const indeterminate = value === undefined;

  return (
    <div className={clsx("w-full", className)}>
      {label && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{label}</span>
          {!indeterminate && <span>{Math.round(value!)}%</span>}
        </div>
      )}
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        {indeterminate ? (
          <div className="h-full w-1/3 bg-brand-500 rounded-full animate-[progress-indeterminate_1.4s_ease-in-out_infinite]" />
        ) : (
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, value!))}%` }}
          />
        )}
      </div>
    </div>
  );
}
