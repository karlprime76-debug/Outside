"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { AppIcon } from "./app-icon";

interface ThemeAwareLogoProps {
  showIcon?: boolean;
  iconSize?: number;
  className?: string;
}

export function ThemeAwareLogo({
  showIcon = true,
  iconSize = 32,
  className,
}: ThemeAwareLogoProps) {
  return (
    <Link
      href="/home"
      className={cn(
        "flex items-center gap-2.5 select-none",
        className
      )}
    >
      {showIcon && <AppIcon size={iconSize} />}
      <span className="text-xl font-extrabold tracking-tight gradient-text">
        OUTSIDE
      </span>
    </Link>
  );
}
