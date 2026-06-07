"use client";

import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { PlanCard } from "@/components/plan-card";
import { OutsideEmptyState } from "@/components/ui/outside-empty-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import type { Plan } from "@/types/plan";

interface PlansSectionProps {
  plans?: Plan[];
  loading?: boolean;
  title?: string;
}

export function PlansSection({ plans = [], loading, title = "Plans pour toi" }: PlansSectionProps) {
  if (loading) {
    return (
      <section className="animate-slide-up">
        <SectionTitle title={title} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (plans.length === 0) {
    return (
      <section className="animate-slide-up">
        <OutsideEmptyState
          icon={Sparkles}
          title="Aucun plan pour le moment"
          description="Dans ta ville. Lance le premier."
          actions={
            <Link
              href="/plans/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
            >
              <Plus className="h-4 w-4" />
              Créer un plan
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <section className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <SectionTitle title={title} />
        {plans.length > 3 && (
          <Link
            href="/plans"
            className="text-xs font-semibold text-outside-500 hover:text-outside-600"
          >
            Voir tout →
          </Link>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {plans.slice(0, 3).map((plan) => (
          <PlanCard key={plan.id} plan={plan} showJoin />
        ))}
      </div>
    </section>
  );
}
