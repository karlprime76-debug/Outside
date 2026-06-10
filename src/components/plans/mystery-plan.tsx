"use client";

import { useState } from "react";
import Link from "next/link";
import { getUserLocale } from "@/lib/locale";
import { Sparkles, Coffee, Dumbbell, Music, PartyPopper, BookOpen, Briefcase, Plane, Shuffle, ArrowRight, Calendar, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MOODS = [
  { label: "Food", icon: Coffee, value: "FOOD" },
  { label: "Chill", icon: Sparkles, value: "CHILL" },
  { label: "Sport", icon: Dumbbell, value: "SPORT" },
  { label: "Musique", icon: Music, value: "MUSIC" },
  { label: "Sortir", icon: PartyPopper, value: "PARTY" },
  { label: "Culture", icon: BookOpen, value: "CULTURE" },
  { label: "Business", icon: Briefcase, value: "BUSINESS" },
  { label: "Voyage", icon: Plane, value: "TRAVEL" },
];

const BUDGETS = [
  { label: "Gratuit", value: "free" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "Premium", value: "premium" },
];

interface MysteryResult {
  type: "existing_plan" | "official_idea" | "create_suggestion";
  plan?: {
    id: string;
    title: string;
    startDate: string;
    creator: {
      name: string | null;
      username: string | null;
      image: string | null;
    };
  };
  idea?: {
    title: string;
    description: string;
    actionLabel: string;
    actionUrl: string;
  };
  suggestion?: {
    title: string;
    description: string;
    mood: string;
    budgetLevel: string;
  };
  message: string;
  actionUrl?: string;
}

export function MysteryPlan() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MysteryResult | null>(null);

  const handleReveal = async () => {
    if (!selectedMood) return;

    setLoading(true);
    try {
      const res = await fetch("/api/plans/mystery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: selectedMood,
          budget: selectedBudget,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("[MYSTERY_PLAN_ERROR]", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shuffle className="h-5 w-5 text-accent-500" />
          <h3 className="font-bold text-[var(--os-fg)]">Plan mystère</h3>
        </div>
        <Badge variant="outline">Surprise</Badge>
      </div>

      <div className="space-y-4">
        {/* Mood selection */}
        <div>
          <p className="text-sm font-medium text-[var(--os-fg)] mb-2">Quel mood ?</p>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((mood) => {
              const Icon = mood.icon;
              return (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all ${
                    selectedMood === mood.value
                      ? "bg-gradient-to-r from-accent-500 to-pink-500 text-white shadow-glow"
                      : "bg-[var(--os-bg)] border border-[var(--os-card-border)] text-[var(--os-fg)] hover:border-accent-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {mood.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget selection */}
        <div>
          <p className="text-sm font-medium text-[var(--os-fg)] mb-2">Budget ?</p>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((budget) => (
              <button
                key={budget.value}
                onClick={() => setSelectedBudget(budget.value)}
                className={`px-3 py-2 rounded-full text-xs font-bold transition-all ${
                  selectedBudget === budget.value
                    ? "bg-gradient-to-r from-accent-500 to-pink-500 text-white shadow-glow"
                    : "bg-[var(--os-bg)] border border-[var(--os-card-border)] text-[var(--os-fg)] hover:border-accent-300"
                }`}
              >
                {budget.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reveal button */}
        <button
          onClick={handleReveal}
          disabled={!selectedMood || loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-500 to-pink-500 text-white font-bold shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Révélation..." : "Révéler le plan mystère"}
        </button>

        {/* Result */}
        {result && (
          <div className="mt-4 p-4 rounded-xl border-2 border-accent-200 bg-gradient-to-br from-accent-50 to-pink-50 dark:from-accent-950/20 dark:to-pink-950/20">
            {result.type === "existing_plan" && result.plan && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-accent-600" />
                  <p className="text-sm font-bold text-accent-700">{result.message}</p>
                </div>
                <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                  <h4 className="font-bold text-[var(--os-fg)]">{result.plan.title}</h4>
                  <p className="text-xs text-[var(--os-muted)] mt-1">
                    par {result.plan.creator.name} · {new Date(result.plan.startDate).toLocaleDateString(getUserLocale())}
                  </p>
                  <Link
                    href={`/plans/${result.plan.id}`}
                    className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-accent-600 hover:text-accent-700"
                  >
                    Voir le plan
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}

            {result.type === "official_idea" && result.idea && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-accent-600" />
                  <p className="text-sm font-bold text-accent-700">{result.message}</p>
                </div>
                <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                  <h4 className="font-bold text-[var(--os-fg)]">{result.idea.title}</h4>
                  <p className="text-xs text-[var(--os-muted)] mt-1">{result.idea.description}</p>
                  <Link
                    href={result.idea.actionUrl}
                    className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-accent-600 hover:text-accent-700"
                  >
                    {result.idea.actionLabel}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}

            {result.type === "create_suggestion" && result.suggestion && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-accent-600" />
                  <p className="text-sm font-bold text-accent-700">{result.message}</p>
                </div>
                <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                  <h4 className="font-bold text-[var(--os-fg)]">{result.suggestion.title}</h4>
                  <p className="text-xs text-[var(--os-muted)] mt-1">{result.suggestion.description}</p>
                  {result.actionUrl && (
                    <Link
                      href={result.actionUrl}
                      className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-accent-600 hover:text-accent-700"
                    >
                      Créer ce plan
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
