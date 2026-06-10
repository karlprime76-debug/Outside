"use client";

import { useEffect, useState } from "react";
import { Repeat, X } from "lucide-react";
import { getUserLocale } from "@/lib/locale";
import { Skeleton } from "@/components/ui/skeleton";

const RECURRENCE_LABELS: Record<string, string> = {
  DAILY: "Tous les jours",
  WEEKLY: "Toutes les semaines",
  MONTHLY: "Tous les mois",
};

interface ChildPlan {
  id: string;
  title: string;
  startDate: string;
  status: string;
  _count: { participants: number };
}

interface ParentPlan {
  id: string;
  title: string;
  startDate: string;
}

export function RecurringSection({
  planId,
  isCreator,
}: {
  planId: string;
  isCreator: boolean;
}) {
  const [recurrence, setRecurrence] = useState<string | null>(null);
  const [childPlans, setChildPlans] = useState<ChildPlan[]>([]);
  const [parentPlan, setParentPlan] = useState<ParentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetch(`/api/plans/${planId}/recurring`)
      .then((r) => r.json())
      .then((data) => {
        setRecurrence(data.recurrence);
        setChildPlans(data.childPlans || []);
        setParentPlan(data.parentPlan || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [planId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }
  if (!recurrence && childPlans.length === 0 && !parentPlan) return null;

  const upcoming = childPlans.filter((p) => p.status === "ACTIVE");

  return (
    <div className="rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-5 space-y-4 ">
      <div className="flex items-center gap-2">
        <Repeat className="h-5 w-5 text-outside-500" />
        <span className="text-sm font-bold text-[var(--os-fg)]">
          {recurrence ? RECURRENCE_LABELS[recurrence] ?? recurrence : "Plan récurrent"}
        </span>
      </div>

      {parentPlan && (
        <div className="text-sm text-[var(--os-muted)]">
          Fait partie d&apos;une série récurrente commencée le{" "}
          {new Date(parentPlan.startDate).toLocaleDateString(getUserLocale())}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">
            Prochaines occurrences ({upcoming.length})
          </p>
          <div className="space-y-1">
            {upcoming.map((cp) => (
              <a
                key={cp.id}
                href={`/plans/${cp.id}`}
                className="flex items-center justify-between rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] px-3 py-2 text-sm hover:bg-[var(--os-card)] transition-colors"
              >
                <span className="font-medium text-[var(--os-fg)]">
                  {new Date(cp.startDate).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
                <span className="text-xs text-[var(--os-muted)]">
                  {cp._count.participants} participant{cp._count.participants !== 1 ? "s" : ""}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {recurrence && isCreator && (
        <button
          onClick={async () => {
            if (!confirm("Annuler toutes les futures occurrences ? Cette action est irréversible.")) return;
            setCancelling(true);
            try {
              const res = await fetch(`/api/plans/${planId}/recurring`, { method: "DELETE" });
              if (res.ok) {
                setRecurrence(null);
                setChildPlans([]);
              }
            } finally {
              setCancelling(false);
            }
          }}
          disabled={cancelling}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
          {cancelling ? "Annulation..." : "Annuler les futures occurrences"}
        </button>
      )}
    </div>
  );
}
