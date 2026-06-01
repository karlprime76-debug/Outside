"use client";

import { cn } from "@/lib/cn";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface OutsideButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gradient";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
}

export const OutsideButton = forwardRef<HTMLButtonElement, OutsideButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--os-focus)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary:
        "bg-outside-600 text-white hover:bg-outside-700",
      secondary:
        "bg-[var(--os-card)] text-[var(--os-fg)] border border-[var(--os-card-border)] hover:bg-[var(--os-card-border)]",
      ghost:
        "bg-transparent text-[var(--os-muted)] hover:bg-[var(--os-card-border)]",
      danger:
        "bg-red-500/10 text-red-600 hover:bg-red-500/20",
      gradient:
        "bg-gradient-to-r from-outside-500 to-accent-500 text-white hover:from-outside-600 hover:to-accent-600 shadow-glow hover:shadow-glow-lg",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs",
      md: "px-5 py-2.5 text-sm",
      lg: "px-8 py-3.5 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);

OutsideButton.displayName = "OutsideButton";
