import { type ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

const maxWidths = {
  sm: "max-w-xl",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "",
};

export function PageShell({
  children,
  className = "",
  animate = true,
  maxWidth = "xl",
}: PageShellProps) {
  return (
    <div
      className={`mx-auto px-4 py-4 pb-24 md:pb-4 pt-safe md:pt-0 ${maxWidths[maxWidth]} ${animate ? "animate-slide-up" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
