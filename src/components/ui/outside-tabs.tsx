"use client";

import React from "react";
import { cn } from "@/lib/cn";

interface TabItem {
  key: string;
  label: string;
}

interface OutsideTabsProps {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
}

export function OutsideTabs({ items, value, onChange }: OutsideTabsProps) {
  return (
    <div className="flex overflow-x-auto scrollbar-hide px-2">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={cn(
            "relative flex-shrink-0 px-3 py-3 text-xs font-bold transition-colors",
            value === it.key ? "text-[var(--os-fg)]" : "text-[var(--os-muted)] hover:text-[var(--os-fg)]"
          )}
        >
          {it.label}
          {value === it.key && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-outside-500 transition-all" />
          )}
        </button>
      ))}
    </div>
  );
}
