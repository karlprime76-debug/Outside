import React from "react";

interface OutsideEmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function OutsideEmptyState({ icon: Icon, title, description, action }: OutsideEmptyStateProps) {
  return (
    <div className="os-card p-8 text-center animate-fade-in">
      {Icon && (
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--os-bg)]">
          <Icon className="h-6 w-6 text-[var(--os-muted)]" />
        </div>
      )}
      <h3 className="text-sm font-bold text-[var(--os-fg)]">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-[var(--os-muted)]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
