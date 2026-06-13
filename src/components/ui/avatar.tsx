"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { useState } from "react";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  ring?: boolean;
  animated?: boolean;
}

const sizeMap = {
  xs: "h-5 w-5 text-[8px]",
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
  xl: "h-14 w-14 text-base",
};

const pixelMap = {
  xs: 20,
  sm: 24,
  md: 32,
  lg: 40,
  xl: 56,
};

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ src, name, size = "md", className, ring, animated }: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const ringClass = ring
    ? animated
      ? "avatar-ring-animated"
      : "avatar-ring"
    : "";

  if (src && !hasError) {
    return (
      <div className={cn("inline-flex shrink-0", ringClass)}>
        <Image
          src={src}
          alt={name || "Avatar"}
          width={pixelMap[size]}
          height={pixelMap[size]}
          className={cn(
            "rounded-full object-cover bg-surface-card",
            sizeMap[size],
            ring ? "" : "border border-[var(--os-card-border)]",
            className
          )}
          unoptimized
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold text-white bg-gradient-to-br from-neon-orange via-neon-rose to-neon-pink shrink-0",
        sizeMap[size],
        ringClass,
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
