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
          <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400", labelClassName)}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 focus:border-transparent bg-white dark:bg-surface-card dark:border-surface-border dark:text-zinc-100 transition-all",
            error && "border-red-300 focus:ring-red-500 dark:border-red-700",
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
