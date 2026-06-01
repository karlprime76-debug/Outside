"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { useOutsideThemeContext } from "@/components/theme-provider";
import { ReactNode, useState } from "react";

interface ImmersiveBackgroundProps {
  daySrc: string;
  nightSrc: string;
  alt: string;
  overlay?: "dark" | "light" | "brand" | "night";
  height?: "screen" | "hero" | "section";
  priority?: boolean;
  className?: string;
  children: ReactNode;
}

const overlayMap = {
  dark: "bg-gradient-to-b from-black/30 via-black/60 to-black/90",
  light: "bg-gradient-to-b from-white/30 via-white/50 to-white/80",
  brand: "bg-gradient-to-br from-outside-900/60 via-accent-900/50 to-black/80",
  night: "bg-gradient-to-b from-[#0a0a0f]/40 via-[#0a0a0f]/75 to-[#0a0a0f]/95",
};

const fallbackMap = {
  dark: "bg-gradient-to-br from-zinc-800 to-black",
  light: "bg-gradient-to-br from-zinc-100 to-white",
  brand: "bg-gradient-to-br from-outside-800 to-accent-900",
  night: "bg-gradient-to-br from-[#0a0a0f] to-black",
};

const heightMap = {
  screen: "min-h-screen",
  hero: "min-h-[70vh] md:min-h-[60vh]",
  section: "min-h-[32vh] md:min-h-[28vh]",
};

export function ImmersiveBackground({
  daySrc,
  nightSrc,
  alt,
  overlay = "dark",
  height = "hero",
  priority = false,
  className,
  children,
}: ImmersiveBackgroundProps) {
  const { isNight, mounted } = useOutsideThemeContext();
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const src = mounted && isNight ? nightSrc : daySrc;

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden",
        heightMap[height],
        className
      )}
    >
      {/* Background image — Next.js Image with fill for optimization */}
      {!error && (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          quality={75}
          sizes="100vw"
          className="object-cover z-[1]"
          onError={() => setError(true)}
          onLoad={() => setLoaded(true)}
        />
      )}

      {/* Fallback gradient if image fails */}
      {error && (
        <div className={cn("absolute inset-0 z-0", fallbackMap[overlay])} />
      )}

      {/* Skeleton shimmer while image loads */}
      {!loaded && !error && (
        <div className="absolute inset-0 z-[2] shimmer" />
      )}

      {/* Overlay gradient */}
      <div className={cn("absolute inset-0 z-[3]", overlayMap[overlay])} />

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
