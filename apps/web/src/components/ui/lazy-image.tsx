"use client";

import { useState } from "react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { clsx } from "clsx";

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderClassName?: string;
  objectFit?: "cover" | "contain" | "fill";
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  placeholderClassName,
  objectFit = "cover",
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const { ref, isIntersecting } = useIntersectionObserver({ freezeOnceVisible: true, rootMargin: "100px" });

  const fitClass = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
  }[objectFit];

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={clsx("relative overflow-hidden bg-gray-100", placeholderClassName)}
      style={width && height ? { width, height } : undefined}
    >
      {isIntersecting && !error && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={clsx(
            "transition-opacity duration-300",
            fitClass,
            loaded ? "opacity-100" : "opacity-0",
            className
          )}
          loading="lazy"
          decoding="async"
        />
      )}

      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
          Không tải được ảnh
        </div>
      )}
    </div>
  );
}
