"use client";

import { useEffect, useState } from "react";
import { Repeat, X } from "lucide-react";

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

  if (loading) return null;
  if (!recurrence && childPlans.length === 0 && !parentPlan) return null;

  const upcoming = childPlans.filter((p) => p.status === "ACTIVE");

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4 dark:border-surface-border dark:bg-surface-card">
      <div className="flex items-center gap-2">
        <Repeat className="h-5 w-5 text-outside-500" />
        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          {recurrence ? RECURRENCE_LABELS[recurrence] ?? recurrence : "Plan récurrent"}
        </span>
      </div>

      {parentPlan && (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Fait partie d&apos;une série récurrente commencée le{" "}
          {new Date(parentPlan.startDate).toLocaleDateString("fr-FR")}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Prochaines occurrences ({upcoming.length})
          </p>
          <div className="space-y-1">
            {upcoming.map((cp) => (
              <a
                key={cp.id}
                href={`/plans/${cp.id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm hover:bg-zinc-100 transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {new Date(cp.startDate).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
                <span className="text-xs text-zinc-500">
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
