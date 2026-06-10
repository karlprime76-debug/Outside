import Link from "next/link";
import { type LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  icon?: LucideIcon;
  action?: { label: string; href: string };
  className?: string;
}

export function SectionHeader({ title, icon: Icon, action, className = "" }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-4 animate-fade-in ${className}`}>
      <h2 className="text-lg font-black text-[var(--os-fg)] flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-neon-orange" />}
        {title}
      </h2>
      {action && (
        <Link
          href={action.href}
          className="text-sm font-bold text-neon-orange hover:text-accent-500 transition-colors flex items-center gap-1 press"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
