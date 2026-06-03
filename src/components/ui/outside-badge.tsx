import React from "react";

interface OutsideBadgeProps {
  children: React.ReactNode;
  variant?: "accent" | "orange" | "neutral" | "success" | "danger";
}

export function OutsideBadge({ children, variant = "accent" }: OutsideBadgeProps) {
  const variants = {
    accent: "bg-accent-100 text-accent-700 border-accent-200",
    orange: "bg-outside-100 text-outside-700 border-outside-200",
    neutral: "bg-[var(--os-card)] text-[var(--os-fg)] border-[var(--os-card-border)]",
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
    danger: "bg-red-100 text-red-700 border-red-200",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${variants[variant]}`}>
      {children}
    </span>
  );
}
