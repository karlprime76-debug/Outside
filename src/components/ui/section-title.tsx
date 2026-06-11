"use client";

import { cn } from "@/lib/cn";
import { type ReactNode } from "react";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionTitle({ title, subtitle, icon, action, className }: SectionTitleProps) {
  return (
    <div className={cn("flex items-start justify-between mb-4 animate-fade-in", className)}>
      <div className="space-y-1">
        <h2 className="text-lg font-black flex items-center gap-2">
          {icon && (
            <span className="text-outside-500 dark:text-outside-400 shrink-0">
              {icon}
            </span>
          )}
          <span className="text-[var(--os-fg)]">{title}</span>
        </h2>
        {subtitle && <p className="text-sm text-[var(--os-muted)]">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
