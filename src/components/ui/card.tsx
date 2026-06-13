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
        "rounded-2xl border border-[var(--os-card-border)] bg-surface-card transition-all shadow-card",
        glass && "os-card-glass",
        hover && "card-hover-premium",
        padMap[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
