"use client";

import { useState } from "react";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fill?: boolean;
  priority?: boolean;
  fallback?: React.ReactNode;
}

export default function LazyImage({
  src,
  alt,
  className,
  fill,
  priority,
  fallback,
  ...props
}: LazyImageProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      fallback || (
        <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-650 bg-zinc-100 dark:bg-zinc-900 font-medium text-xs">
          No Image
        </div>
      )
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
      {/* CSS-only background shimmer */}
      <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-850 animate-pulse" />

      {/* Using standard img element to bypass Next.js Image optimization remote pattern restrictions */}
      <img
        src={src}
        alt={alt || "Product Image"}
        loading="lazy"
        className={`relative z-10 transition-opacity duration-300 ${
          fill ? "absolute inset-0 w-full h-full object-cover" : ""
        } ${className || ""}`}
        onError={() => setError(true)}
        {...props}
      />
    </div>
  );
}

