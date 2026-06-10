"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex rounded-xl border border-[var(--os-card-border)] bg-surface-card p-1">
        <div className="h-8 w-8" />
        <div className="h-8 w-8" />
        <div className="h-8 w-8" />
      </div>
    );
  }

  const options = [
    { value: "light", icon: Sun, label: "Clair" },
    { value: "dark", icon: Moon, label: "Sombre" },
    { value: "system", icon: Monitor, label: "Automatique" },
  ] as const;

  return (
    <div className="inline-flex rounded-xl border border-[var(--os-card-border)] bg-surface-card p-1">
      {options.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            title={opt.label}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
              active
                ? "bg-surface-border text-neon-orange shadow-sm"
                : "text-[var(--os-muted)] hover:text-[var(--os-fg)]"
            }`}
          >
            <opt.icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

export function ThemeBadge() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-lg p-2 text-[var(--os-muted)] hover:bg-white/5 hover:text-[var(--os-fg)] transition-colors"
      title={isDark ? "Passer en clair" : "Passer en sombre"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
