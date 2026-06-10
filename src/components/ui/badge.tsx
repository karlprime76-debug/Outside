"use client";

import { cn } from "@/lib/cn";

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "orange"
    | "pink"
    | "green"
    | "blue"
    | "purple"
    | "amber"
    | "slate"
    | "red"
    | "outline";
  size?: "sm" | "md";
  className?: string;
}

const variants = {
  default: "bg-zinc-800 text-zinc-200",
  orange:
    "bg-outside-500/15 text-outside-400 border border-outside-500/20",
  pink: "bg-accent-500/15 text-accent-400 border border-accent-500/20",
  green:
    "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  blue: "bg-sky-500/15 text-sky-400 border border-sky-500/20",
  purple:
    "bg-violet-500/15 text-violet-400 border border-violet-500/20",
  amber:
    "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  slate: "bg-zinc-700 text-zinc-300",
  red: "bg-red-500/15 text-red-400 border border-red-500/20",
  outline: "border border-[var(--os-card-border)] text-[var(--os-muted)] bg-transparent",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
