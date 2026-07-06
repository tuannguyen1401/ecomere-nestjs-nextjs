"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";

interface LazyImageProps extends Omit<ImageProps, "onError"> {
  fallback?: React.ReactNode;
}

export default function LazyImage({
  src,
  alt,
  className,
  fallback,
  ...props
}: LazyImageProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      fallback || (
        <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-900 font-medium text-xs">
          No Image
        </div>
      )
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
      {/* CSS-only background shimmer. Will be naturally covered when the image renders. */}
      <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-850 animate-pulse" />

      <Image
        src={src}
        alt={alt}
        className={`relative z-10 ${className || ""}`}
        onError={() => setError(true)}
        {...props}
      />
    </div>
  );
}
