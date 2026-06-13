"use client";

import { cn } from "@/lib/cn";

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all press-3d",
              isActive
                ? "bg-[var(--os-fg)] text-[var(--os-bg)] shadow-[0_0_12px_rgba(255,255,255,0.08)]"
                : "bg-surface-card text-[var(--os-muted)] hover:text-[var(--os-fg)] border border-[var(--os-card-border)] hover:border-[rgba(249,115,22,0.15)]"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
