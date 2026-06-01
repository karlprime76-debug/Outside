"use client";

import { cn } from "@/lib/cn";
import { type ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, icon, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between mb-6",
        className
      )}
    >
      <h1 className="text-2xl font-black flex items-center gap-3">
        {icon && (
          <span className="flex items-center justify-center rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow shrink-0">
            {icon}
          </span>
        )}
        <span className="gradient-text">{title}</span>
      </h1>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
