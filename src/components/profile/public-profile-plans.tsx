"use client";

import { useState } from "react";
import { PlanCard } from "@/components/plan-card";

interface PlanLite {
  id: string;
  title: string;
  mood: string;
  planCategory: string;
  budgetLevel: string;
  budgetAmount: unknown;
  budgetCurrency: string | null;
  budgetIsFrom: boolean;
  startDate: string;
  maxParticipants: number;
  status: string;
  city: { name: string };
  creator: { name: string | null; image?: string | null };
  creatorUsername?: string | null;
  creatorId?: string | null;
  _count: { participants: number };
}

export function PublicProfilePlans({ initial }: { initial: PlanLite[] }) {
  const [visible, setVisible] = useState(6);
  const canShowMore = initial.length > visible;

  return (
    <div className="space-y-3">
      {initial.slice(0, visible).map((p) => (
        <PlanCard key={p.id} plan={p} />
      ))}
      {canShowMore && (
        <button
          onClick={() => setVisible((v) => v + 6)}
          className="w-full rounded-xl bg-[var(--os-card)] border border-[var(--os-card-border)] px-4 py-2 text-sm font-semibold text-[var(--os-fg)] hover:border-outside-300 transition-colors"
        >
          Voir plus
        </button>
      )}
    </div>
  );
}
