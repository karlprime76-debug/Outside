"use client";

export type MomentMediaFilter = "all" | "posts" | "clips";

const LABELS: Record<MomentMediaFilter, string> = {
  all: "Tout",
  posts: "Publications",
  clips: "Clips",
};

interface MomentTypeFilterProps {
  value: MomentMediaFilter;
  onChange: (value: MomentMediaFilter) => void;
}

export function MomentTypeFilter({ value, onChange }: MomentTypeFilterProps) {
  return (
    <div className="flex items-center gap-1">
      {(["all", "posts", "clips"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          aria-current={value === m ? "true" : undefined}
          className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-colors ${
            value === m
              ? "text-[var(--os-fg)] bg-[var(--os-card-border)]/60"
              : "text-[var(--os-muted)] hover:text-[var(--os-fg)]"
          }`}
        >
          {LABELS[m]}
        </button>
      ))}
    </div>
  );
}
