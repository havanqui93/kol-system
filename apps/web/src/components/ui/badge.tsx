import { clsx } from "clsx";

type BadgeVariant = "gray" | "yellow" | "blue" | "green" | "red" | "purple";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  gray: "bg-gray-100 text-gray-700",
  yellow: "bg-yellow-100 text-yellow-800",
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  purple: "bg-purple-100 text-purple-800",
};

export function Badge({ variant = "gray", children, className }: BadgeProps) {
  return (
    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}

// Maps VideoProjectStatus to badge variant + label
const STATUS_MAP: Record<string, { variant: BadgeVariant; label: string }> = {
  draft:              { variant: "gray",   label: "Nháp" },
  script_generating:  { variant: "yellow", label: "Đang tạo kịch bản..." },
  script_ready:       { variant: "blue",   label: "Kịch bản sẵn sàng" },
  script_approved:    { variant: "blue",   label: "Kịch bản đã duyệt" },
  audio_generating:   { variant: "yellow", label: "Đang tạo giọng nói..." },
  audio_ready:        { variant: "blue",   label: "Audio sẵn sàng" },
  video_generating:   { variant: "yellow", label: "Đang tạo video Kling..." },
  clips_ready:        { variant: "blue",   label: "Clips sẵn sàng" },
  rendering:          { variant: "yellow", label: "Đang render..." },
  rendered:           { variant: "blue",   label: "Đã render" },
  qa_checking:        { variant: "purple", label: "Đang kiểm tra QA" },
  ready_to_publish:   { variant: "green",  label: "Sẵn sàng đăng" },
  publishing:         { variant: "yellow", label: "Đang đăng..." },
  published:          { variant: "green",  label: "Đã đăng" },
  failed:             { variant: "red",    label: "Thất bại" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? { variant: "gray" as BadgeVariant, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
