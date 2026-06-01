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
    | "red";
  size?: "sm" | "md";
  className?: string;
}

const variants = {
  default: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  orange:
    "bg-outside-100 text-outside-700 dark:bg-outside-950/30 dark:text-outside-300",
  pink: "bg-accent-100 text-accent-700 dark:bg-accent-950/30 dark:text-accent-300",
  green:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  blue: "bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300",
  purple:
    "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
  amber:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  red: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300",
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
