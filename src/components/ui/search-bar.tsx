"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  placeholder = "Rechercher...",
  value,
  onChange,
  onSubmit,
  className,
  autoFocus = false,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(value || "");
  const currentValue = value !== undefined ? value : internalValue;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (value === undefined) setInternalValue(v);
    onChange?.(v);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit?.(currentValue);
  }

  function clear() {
    if (value === undefined) setInternalValue("");
    onChange?.("");
    onSubmit?.("");
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        type="text"
        value={currentValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full rounded-xl border border-zinc-300 bg-white py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 focus:border-transparent dark:bg-surface-card dark:border-surface-border dark:text-zinc-100 transition-all"
      />
      {currentValue && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
