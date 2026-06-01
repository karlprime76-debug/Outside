"use client";

import { cn } from "@/lib/cn";
import { useOutsideThemeContext } from "@/components/theme-provider";
import { ReactNode } from "react";

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

  const src = mounted && isNight ? nightSrc : daySrc;

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden isolate",
        heightMap[height],
        className
      )}
    >
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        className="absolute inset-0 h-full w-full object-cover -z-20"
      />

      {/* Overlay gradient */}
      <div className={cn("absolute inset-0 -z-10", overlayMap[overlay])} />

      {/* Content */}
      <div className="relative z-0 flex flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
