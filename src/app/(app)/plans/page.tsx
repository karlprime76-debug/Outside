"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDictionary } from "@/hooks/use-dictionary";
import { PlanCard } from "@/components/plan-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AnimatedPage } from "@/components/ui/animated-page";
import { SearchBar } from "@/components/ui/search-bar";
import { useDebounce } from "@/hooks/use-debounce";
import { CalendarDays, Plus, SlidersHorizontal, X, Mail, Check, XCircle } from "lucide-react";
import { ImmersiveBackground } from "@/components/ui/immersive-background";
import { backgrounds } from "@/lib/backgrounds";

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

interface Invitation {
  id: string;
  plan: {
    id: string;
    title: string;
    mood: string;
    startDate: string;
    city: { name: string };
    creator: { id: string; name: string | null; image: string | null };
  };
  sender: { id: string; name: string | null; image: string | null };
  createdAt: string;
}

export default function PlansPage() {
  const t = useDictionary();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState("");
  const [budget, setBudget] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);

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

    fetch("/api/plans/invitations")
      .then((r) => r.json())
      .then((data) => {
        setInvitations(data.invitations || []);
        setLoadingInvitations(false);
      })
      .catch(() => setLoadingInvitations(false));
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
    <AnimatedPage className="p-4 max-w-5xl mx-auto space-y-6 animate-slide-up">
      {/* Bandeau immersif */}
      <ImmersiveBackground
        daySrc={backgrounds.plans.day}
        nightSrc={backgrounds.plans.night}
        alt="Plans background"
        overlay="night"
        height="section"
        className="rounded-2xl animate-fade-in"
      >
        <div className="flex flex-1 flex-col justify-center p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white drop-shadow">{t.plans.title}</h1>
              <p className="text-sm text-white/70">Ce soir, trouve ton mood.</p>
            </div>
            <Link
              href="/plans/new"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable shrink-0 animate-soft-glow"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t.plans.newPlan}</span>
            </Link>
          </div>
        </div>
      </ImmersiveBackground>

      {/* Search */}
      <SearchBar
        placeholder="Rechercher un plan..."
        value={search}
        onChange={setSearch}
        className="max-w-md"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-[var(--os-muted)]" />
        <select
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="rounded-full border border-[var(--os-card-border)] px-4 py-2 text-xs font-semibold bg-[var(--os-card)] text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
        >
          <option value="">Mood</option>
          {MOODS.map((m) => <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>)}
        </select>
        <select
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="rounded-full border border-[var(--os-card-border)] px-4 py-2 text-xs font-semibold bg-[var(--os-card)] text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
        >
          <option value="">Budget</option>
          {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={() => { setMood(""); setBudget(""); }}
            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--os-muted)] hover:text-red-500 transition-colors"
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

      {/* Invitations */}
      {!loadingInvitations && invitations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-5 w-5 text-outside-500" />
            <h2 className="text-lg font-black text-[var(--os-fg)]">Invitations reçues</h2>
          </div>
          <div className="space-y-3">
            {invitations.map((inv) => (
              <div key={inv.id} className="os-card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--os-fg)] truncate">{inv.plan.title}</p>
                  <p className="text-xs text-[var(--os-muted)]">
                    Par {inv.sender.name || "Anonyme"} · {inv.plan.city.name}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/plans/invitations/${inv.id}/accept`, { method: "POST" });
                      if (res.ok) {
                        setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
                        window.location.reload();
                      }
                    }}
                    className="rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200 transition-colors"
                    title="Accepter"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/plans/invitations/${inv.id}/decline`, { method: "POST" });
                      if (res.ok) {
                        setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
                      }
                    }}
                    className="rounded-lg bg-red-100 p-2 text-red-700 hover:bg-red-200 transition-colors"
                    title="Refuser"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
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
          {filteredPlans.map((plan, i) => (
            <div key={plan.id} className={`animate-slide-up animate-stagger-${Math.min(i+1, 6)}`}>
              <PlanCard plan={plan} showJoin />
            </div>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
