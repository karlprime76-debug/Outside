"use client";

import { cn } from "@/lib/cn";

interface AppIconProps {
  size?: number;
  className?: string;
}

export function AppIcon({ size = 40, className }: AppIconProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-2xl overflow-hidden shrink-0 shadow-glow",
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/outside-logo.png"
        alt="OUTSIDE"
        width={size}
        height={size}
        className="object-cover w-full h-full"
      />
    </div>
  );
}
