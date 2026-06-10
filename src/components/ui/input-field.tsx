"use client";

import { cn } from "@/lib/cn";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  labelClassName?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, className, labelClassName, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]", labelClassName)}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-xl border border-[var(--os-card-border)] px-4 py-3 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] bg-surface-card focus:outline-none focus:ring-2 focus:ring-neon-orange/40 focus:border-neon-orange/50 transition-all",
            error && "border-red-500/50 focus:ring-red-500/40 focus:border-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

InputField.displayName = "InputField";
