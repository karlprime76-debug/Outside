"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDictionary } from "@/hooks/use-dictionary";
import { PlanCard } from "@/components/plan-card";
import { EmptyState } from "@/components/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AnimatedPage } from "@/components/ui/animated-page";
import { SearchBar } from "@/components/ui/search-bar";
import { useDebounce } from "@/hooks/use-debounce";
import { CalendarDays, Plus, SlidersHorizontal, X } from "lucide-react";

interface Plan {
  id: string;
  title: string;
  mood: string;
  budgetLevel: string;
  startDate: string;
  maxParticipants: number;
  status: string;
  city: { name: string };
  creator: { name: string | null; image?: string | null };
  _count: { participants: number };
}

const MOODS = ["CHILL", "FOOD", "SPORT", "PARTY", "MUSIC", "DATING", "FRIENDS", "STUDY", "BUSINESS", "CULTURE", "TRAVEL", "GAMING", "FITNESS"];
const BUDGETS = ["FREE", "LOW", "MEDIUM", "PREMIUM"];

const MOOD_VARIANTS: Record<string, Parameters<typeof Badge>[0]["variant"]> = {
  CHILL: "blue", FOOD: "orange", SPORT: "green", PARTY: "purple",
  MUSIC: "pink", DATING: "pink", FRIENDS: "blue", STUDY: "amber",
  BUSINESS: "slate", CULTURE: "purple", TRAVEL: "green", GAMING: "orange", FITNESS: "green",
};

export default function PlansPage() {
  const t = useDictionary();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState("");
  const [budget, setBudget] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const params = new URLSearchParams();
    if (mood) params.set("mood", mood);
    if (budget) params.set("budgetLevel", budget);

    setLoading(true);
    fetch(`/api/plans?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setPlans(data.plans || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [mood, budget]);

  const hasFilters = mood || budget || search;

  const filteredPlans = debouncedSearch
    ? plans.filter((p) =>
        p.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.mood.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.city.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : plans;

  return (
    <AnimatedPage className="p-4 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          {t.plans.title}
        </h1>
        <Link
          href="/plans/new"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t.plans.newPlan}</span>
        </Link>
      </div>

      {/* Search */}
      <SearchBar
        placeholder="Rechercher un plan..."
        value={search}
        onChange={setSearch}
        className="max-w-md"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
        <select
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold bg-white dark:bg-surface-card dark:border-surface-border dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-outside-500"
        >
          <option value="">Mood</option>
          {MOODS.map((m) => <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>)}
        </select>
        <select
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold bg-white dark:bg-surface-card dark:border-surface-border dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-outside-500"
        >
          <option value="">Budget</option>
          {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={() => { setMood(""); setBudget(""); }}
            className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition-colors"
          >
            <X className="h-3 w-3" />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Active filters display */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {mood && (
            <Badge variant={MOOD_VARIANTS[mood] || "default"}>
              {mood}
            </Badge>
          )}
          {budget && (
            <Badge variant="slate">{budget}</Badge>
          )}
        </div>
      )}

      {/* Plans grid */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={search ? "Aucun résultat" : t.emptyStates.noPlansTitle}
          description={search ? "Essaye un autre mot-clé." : t.emptyStates.noPlansDesc}
          cta={!search ? { label: t.emptyStates.noPlansCta, href: "/plans/new" } : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} showJoin />
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
