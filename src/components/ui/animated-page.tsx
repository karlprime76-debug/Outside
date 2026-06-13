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
        "fade-in-up",
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
              className="fade-in-up"
              style={{ animationDelay: `${i * stagger}ms` }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}
