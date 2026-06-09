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
        "bg-outside-600 text-white hover:bg-outside-700 focus:ring-outside-500 dark:bg-outside-500 dark:hover:bg-outside-400",
      secondary:
        "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-400 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
      ghost:
        "bg-transparent text-zinc-700 hover:bg-zinc-100 focus:ring-zinc-400 dark:text-zinc-300 dark:hover:bg-zinc-800/50",
      danger:
        "bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-400 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50",
      gradient:
        "bg-gradient-to-r from-outside-500 to-accent-500 text-white hover:from-outside-600 hover:to-accent-600 focus:ring-outside-500 shadow-glow hover:shadow-glow-lg",
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
