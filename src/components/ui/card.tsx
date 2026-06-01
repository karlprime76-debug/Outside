"use client";

import { cn } from "@/lib/cn";
import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  glass?: boolean;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className,
  glass = false,
  hover = false,
  padding = "md",
}: CardProps) {
  const padMap = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200 bg-white transition-all dark:border-surface-border dark:bg-surface-card",
        glass && "glass border-white/20 dark:border-white/10",
        hover && "hover:shadow-card-hover hover:-translate-y-0.5",
        !glass && "shadow-card",
        padMap[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
