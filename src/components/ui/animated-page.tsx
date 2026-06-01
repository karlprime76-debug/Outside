"use client";

import { cn } from "@/lib/cn";
import { type ReactNode } from "react";

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedPage({ children, className, delay = 0 }: AnimatedPageProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards duration-500",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function StaggerContainer({
  children,
  className,
  stagger = 50,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              className="animate-in fade-in slide-in-from-bottom-3 fill-mode-backwards duration-400"
              style={{ animationDelay: `${i * stagger}ms` }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}
