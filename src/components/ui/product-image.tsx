import { useState } from "react";

import { cn } from "@/lib/utils";

const FALLBACK = "https://placehold.co/800x800/e4e4e7/18181b?text=DI+CHIES";

export function ProductImage({
  src,
  alt,
  className,
  sizes,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-surface-strong", className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-surface-strong" aria-hidden />}
      <img
        src={failed || !src ? FALLBACK : src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        sizes={sizes}
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
        className={cn(
          "size-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}