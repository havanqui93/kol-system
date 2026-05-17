import { clsx } from "clsx";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={clsx("inline-block w-5 h-5 border-2 border-gray-300 border-t-brand-600 rounded-full animate-spin", className)}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner className="w-8 h-8" />
    </div>
  );
}
