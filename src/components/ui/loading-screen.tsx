"use client";

import { cn } from "@/lib/cn";

interface LoadingScreenProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingScreen({ className, size = "md" }: LoadingScreenProps) {
  const sizeMap = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className={cn("relative", sizeMap[size])}>
        <div className="absolute inset-0 rounded-full border-2 border-zinc-200 dark:border-zinc-800" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-outside-500 animate-spin" />
      </div>
      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Chargement...</span>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingScreen size="lg" />
    </div>
  );
}
