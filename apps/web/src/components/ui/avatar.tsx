import { clsx } from "clsx";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-14 h-14 text-xl",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function getColorFromName(name: string): string {
  const colors = [
    "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500",
    "bg-teal-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500",
  ];
  const idx = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}

export function Avatar({ src, name = "?", size = "md", className }: AvatarProps) {
  const sizeClass = SIZE_CLASSES[size];
  const colorClass = getColorFromName(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx("rounded-full object-cover flex-shrink-0", sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        "rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0",
        sizeClass,
        colorClass,
        className
      )}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
