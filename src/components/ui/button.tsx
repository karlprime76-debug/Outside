"use client";

import { cn } from "@/lib/cn";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gradient";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
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
      "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary:
        "bg-gradient-to-r from-neon-orange via-[#FF5A5F] to-neon-pink text-white hover:brightness-110 focus:ring-neon-orange shadow-glow hover:shadow-glow-lg",
      secondary:
        "bg-surface-card text-[var(--os-fg)] border border-[var(--os-card-border)] hover:border-neon-orange/30 focus:ring-neon-orange hover:text-[var(--os-fg)]",
      ghost:
        "bg-transparent text-[var(--os-muted)] hover:text-[var(--os-fg)] hover:bg-white/5 focus:ring-neon-orange",
      danger:
        "bg-red-500/10 text-red-400 hover:bg-red-500/20 focus:ring-red-400 border border-red-500/20",
      gradient:
        "bg-gradient-to-r from-neon-orange via-neon-rose to-neon-magenta text-white hover:brightness-110 focus:ring-neon-orange shadow-glow hover:shadow-glow-lg",
    };

    const sizes = {
      sm: "px-4 py-2.5 text-xs",
      md: "px-5 py-3 text-sm",
      lg: "px-8 py-3.5 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
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

Button.displayName = "Button";
