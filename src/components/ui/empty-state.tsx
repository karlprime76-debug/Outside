import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  cta?: { label: string; href: string };
  actions?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, cta, actions }: EmptyStateProps) {
  return (
    <div className="os-card p-10 text-center animate-fade-in">
      {Icon && (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--os-bg)] mb-4">
          <Icon className="h-7 w-7 text-[var(--os-muted)]" />
        </div>
      )}
      <h3 className="text-sm font-bold text-[var(--os-fg)]">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-[var(--os-muted)]">{description}</p>
      )}
      {actions ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">{actions}</div>
      ) : cta ? (
        <Link
          href={cta.href}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all press"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
