interface StatusBadgeProps {
  status: "live" | "soon" | "ended" | "open" | "closed" | "verified" | string;
  text?: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  live: "bg-red-100 text-red-700 border-red-200 animate-soft-glow",
  soon: "bg-amber-100 text-amber-700 border-amber-200",
  ended: "bg-zinc-100 text-zinc-600 border-zinc-200",
  open: "bg-emerald-100 text-emerald-700 border-emerald-200",
  closed: "bg-zinc-100 text-zinc-600 border-zinc-200",
  verified: "bg-sky-100 text-sky-700 border-sky-200",
};

export function StatusBadge({ status, text, className = "" }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.open;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${style} ${className}`}
    >
      {status === "live" && (
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
      )}
      {text || status}
    </span>
  );
}
