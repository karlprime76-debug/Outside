import { cn } from "@/lib/cn";
import { BadgeCheck } from "lucide-react";

interface OfficialBadgeProps {
  accountKind?: string | null;
  city?: string | null;
  className?: string;
}

const LABELS: Record<string, string> = {
  OFFICIAL_GUIDE: "Guide",
  OFFICIAL_CITY: "Compte officiel",
};

export function OfficialBadge({ accountKind, city, className }: OfficialBadgeProps) {
  const label = accountKind ? LABELS[accountKind] ?? null : null;
  if (!label) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
        className
      )}
    >
      <BadgeCheck className="h-3 w-3" />
      {label}
      {city ? ` ${city}` : ""}
    </span>
  );
}
