"use client";

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return "Aujourd'hui";
  if (isYesterday) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

interface DmDateSeparatorProps {
  date: string;
}

export function DmDateSeparator({ date }: DmDateSeparatorProps) {
  return (
    <div className="flex items-center justify-center my-4">
      <div className="rounded-full bg-[var(--os-card)] border border-[var(--os-card-border)] px-3 py-1">
        <span className="text-[10px] font-bold text-[var(--os-muted)] uppercase tracking-wide">
          {formatDateLabel(date)}
        </span>
      </div>
    </div>
  );
}
