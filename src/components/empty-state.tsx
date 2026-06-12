"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  cta?: { label: string; href: string };
  actions?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, cta, actions }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center fade-in-up">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-outside-500/20 to-accent-500/20 blur-xl" />
        <div className="relative rounded-2xl bg-gradient-to-br from-outside-100 to-accent-100 p-5">
          <Icon className="h-10 w-10 text-outside-600" />
        </div>
      </div>
      <h3 className="mt-5 text-xl font-bold text-[var(--os-fg)]">{title}</h3>
      <p className="mt-2 max-w-xs text-sm text-[var(--os-muted)] leading-relaxed">{description}</p>
      {actions ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div>
      ) : cta ? (
        <Link
          href={cta.href}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-7 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
