"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { useOutsideThemeContext } from "@/components/theme-provider";

interface AppIconProps {
  size?: number;
  className?: string;
}

export function AppIcon({ size = 40, className }: AppIconProps) {
  const { isNight, mounted } = useOutsideThemeContext();

  const src = isNight
    ? "/brand/outside-icon-night.png"
    : "/brand/outside-icon-day.png";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-2xl overflow-hidden shrink-0",
        className
      )}
      style={{ width: size, height: size }}
    >
      {mounted ? (
        <Image
          src={src}
          alt="OUTSIDE"
          width={size}
          height={size}
          className="object-contain"
          unoptimized
        />
      ) : (
        <div
          className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500"
          style={{ width: size * 0.7, height: size * 0.7 }}
        />
      )}
    </div>
  );
}
