"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface AppShellProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function AppShell({ children, className, noPadding = false }: AppShellProps) {
  return (
    <div
      className={cn(
        "min-h-screen w-full transition-colors duration-300",
        "bg-[var(--os-bg)] text-[var(--os-fg)]",
        !noPadding && "px-4 py-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-4",
        className
      )}
    >
      {children}
    </div>
  );
}
