"use client";

import { cn } from "@/lib/cn";
import { type ReactNode } from "react";

interface SectionTitleProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionTitle({ title, icon, action, className }: SectionTitleProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <h2 className="text-lg font-black flex items-center gap-2">
        {icon && (
          <span className="text-outside-600 dark:text-outside-400 shrink-0">
            {icon}
          </span>
        )}
        <span className="text-zinc-900 dark:text-zinc-100">{title}</span>
      </h2>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
