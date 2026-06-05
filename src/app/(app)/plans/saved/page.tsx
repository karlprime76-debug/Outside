"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatedPage } from "@/components/ui/animated-page";
import { PlanCard } from "@/components/plan-card";
import { ArrowLeft, Bookmark, Loader2 } from "lucide-react";

interface SavedPlan {
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

export default function SavedPlansPage() {
  const { status } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      loadSaved();
    }
  }, [status, router]);

  async function loadSaved() {
    setLoading(true);
    try {
      const res = await fetch("/api/plans/saved");
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <AnimatedPage className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-outside-500" />
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6 pb-24 md:pb-4">
      <div className="flex items-center gap-3">
        <Link
          href="/plans"
          className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Plans
        </Link>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">Plans enregistrés</h1>
      </div>

      {plans.length === 0 ? (
        <div className="os-card p-8 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-outside-100 flex items-center justify-center">
            <Bookmark className="h-6 w-6 text-outside-600" />
          </div>
          <p className="text-sm text-[var(--os-muted)]">
            Tu n&apos;as encore sauvegardé aucun plan.
          </p>
          <Link
            href="/plans"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
          >
            Découvrir des plans
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
