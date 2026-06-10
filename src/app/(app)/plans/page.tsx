"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDictionary } from "@/hooks/use-dictionary";
import { PlanCard } from "@/components/plan-card";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { InviteCircle } from "@/components/referrals/invite-circle";
import { EmptyState } from "@/components/ui/empty-state";
import { AnimatedPage } from "@/components/ui/animated-page";
import { SearchBar } from "@/components/ui/search-bar";
import { useDebounce } from "@/hooks/use-debounce";
import { CalendarDays, Plus, SlidersHorizontal, X, Mail, Check, XCircle, Bookmark, Sparkles, List, Calendar } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { ImmersiveBackground } from "@/components/ui/immersive-background";
import { backgrounds } from "@/lib/backgrounds";
import type { Plan } from "@/types/plan";

const PLAN_CATEGORIES = [
  { value: "CHILL", label: "Chill" },
  { value: "FOOD", label: "Food" },
  { value: "SPORT", label: "Sport" },
  { value: "MUSIC", label: "Musique" },
  { value: "SORTIE", label: "Sortie" },
  { value: "CULTURE", label: "Culture" },
  { value: "BUSINESS", label: "Business" },
  { value: "VOYAGE", label: "Voyage" },
  { value: "ETUDES", label: "Études" },
  { value: "AUTRE", label: "Autre" },
];

interface Invitation {
  id: string;
  plan: { id: string; title: string; mood: string; startDate: string; city: { name: string }; creator: { id: string; name: string | null; image: string | null } };
  sender: { id: string; name: string | null; image: string | null };
  createdAt: string;
}

type Tab = "tous" | "suggestions" | "mes-plans";

export default function PlansPage() {
  const t = useDictionary();
  const [tab, setTab] = useState<Tab>("tous");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState("");
  const [planCategory, setPlanCategory] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("dateAsc");
  const [recalcKey, setRecalcKey] = useState(0);
  const debouncedSearch = useDebounce(search, 300);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [suggestions, setSuggestions] = useState<Plan[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [myPlansData, setMyPlansData] = useState<Plan[]>([]);
  const [loadingMyPlans, setLoadingMyPlans] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (mood) params.set("mood", mood);
    if (planCategory) params.set("planCategory", planCategory);
    if (freeOnly) params.set("isFree", "true");
    if (sortBy) params.set("sortBy", sortBy);

    setLoading(true);
    fetch(`/api/plans?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setPlans(data.plans || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [mood, planCategory, freeOnly, sortBy, recalcKey]);

  useEffect(() => {
    fetch("/api/plans/invitations")
      .then((r) => r.json())
      .then((data) => {
        setInvitations(data.invitations || []);
        setLoadingInvitations(false);
      })
      .catch(() => setLoadingInvitations(false));
  }, []);

  useEffect(() => {
    if (tab !== "suggestions") return;
    setLoadingSuggestions(true);
    fetch("/api/plans/suggestions")
      .then((r) => r.json())
      .then((data) => {
        setSuggestions(data.plans || []);
        setLoadingSuggestions(false);
      })
      .catch(() => setLoadingSuggestions(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== "mes-plans") return;
    setLoadingMyPlans(true);
    fetch("/api/plans?myPlans=true")
      .then((r) => r.json())
      .then((data) => {
        setMyPlansData(data.plans || []);
        setLoadingMyPlans(false);
      })
      .catch(() => setLoadingMyPlans(false));
  }, [tab]);

  const hasFilters = mood || planCategory || freeOnly || search;

  const filteredPlans = debouncedSearch
    ? plans.filter((p) =>
        p.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.mood.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.city.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.planCategory.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : plans;

  return (
    <AnimatedPage className="p-4 max-w-5xl mx-auto space-y-6 pb-24 md:pb-4 animate-slide-up">
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
              <p className="text-sm text-white/70">{t.planFilters.findYourMood}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/plans/saved"
                className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2.5 text-sm font-bold text-white hover:bg-white/30 transition-all"
                title="Plans enregistrés"
              >
                <Bookmark className="h-4 w-4" />
                <span className="hidden sm:inline">Enregistrés</span>
              </Link>
              <Link
                href="/plans/new"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable animate-soft-glow"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t.plans.newPlan}</span>
              </Link>
            </div>
          </div>
        </div>
      </ImmersiveBackground>

      <Tabs
        tabs={[
          { id: "tous", label: "Tous", icon: List },
          { id: "suggestions", label: "Suggestions", icon: Sparkles },
          { id: "mes-plans", label: "Mes plans", icon: Calendar },
        ]}
        active={tab}
        onChange={(id) => setTab(id as Tab)}
      />

      {tab === "tous" && (
      <>
      <SearchBar placeholder="Rechercher un plan..." value={search} onChange={setSearch} className="max-w-md" />

      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-[var(--os-muted)]" />
        <select
          value={planCategory}
          onChange={(e) => setPlanCategory(e.target.value)}
          className="rounded-full border border-[var(--os-card-border)] px-4 py-2 text-xs font-semibold bg-[var(--os-card)] text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
        >
          <option value="">{t.planFilters.category}</option>
          {PLAN_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="rounded-full border border-[var(--os-card-border)] px-4 py-2 text-xs font-semibold bg-[var(--os-card)] text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
        >
          <option value="">{t.planFilters.mood}</option>
          <option value="CHILL">Chill</option>
          <option value="FOOD">Food</option>
          <option value="SPORT">Sport</option>
          <option value="MUSIC">Musique</option>
          <option value="DATING">Dating</option>
          <option value="PARTY">Sortir</option>
          <option value="CULTURE">Culture</option>
          <option value="BUSINESS">Business</option>
          <option value="TRAVEL">Voyage</option>
          <option value="STUDY">Études</option>
        </select>
        <button
          onClick={() => setFreeOnly((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
            freeOnly
              ? "border-outside-500 bg-outside-50 text-outside-700"
              : "border-[var(--os-card-border)] bg-[var(--os-card)] text-[var(--os-fg)] hover:bg-[var(--os-card-border)]"
          }`}
        >
          Gratuit
        </button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-full border border-[var(--os-card-border)] px-4 py-2 text-xs font-semibold bg-[var(--os-card)] text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
        >
          <option value="dateAsc">{t.planFilters.soon}</option>
          <option value="popular">{t.planFilters.popular}</option>
          <option value="recent">{t.planFilters.recent}</option>
          <option value="priceAsc">Moins cher</option>
          <option value="priceDesc">Plus cher</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => { setMood(""); setPlanCategory(""); setFreeOnly(false); setSearch(""); setSortBy("dateAsc"); setRecalcKey((k) => k + 1); }}
            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--os-muted)] hover:text-red-500 transition-colors"
          >
            <X className="h-3 w-3" />
            Réinitialiser
          </button>
        )}
      </div>

      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {planCategory && (
            <Badge variant="slate">{PLAN_CATEGORIES.find(c => c.value === planCategory)?.label || planCategory}</Badge>
          )}
          {mood && <Badge variant="slate">{mood}</Badge>}
          {freeOnly && <Badge variant="green">Gratuit</Badge>}
        </div>
      )}

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
                  <p className="text-xs text-[var(--os-muted)]">Par {inv.sender.name || "Anonyme"} · {inv.plan.city.name}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/plans/invitations/${inv.id}/accept`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attendance: "GOING" }) });
                      if (res.ok) { setInvitations((prev) => prev.filter((i) => i.id !== inv.id)); window.location.reload(); }
                    }}
                    className="rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200 transition-colors" title="Accepter"
                  ><Check className="h-4 w-4" /></button>
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/plans/invitations/${inv.id}/accept`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attendance: "MAYBE" }) });
                      if (res.ok) { setInvitations((prev) => prev.filter((i) => i.id !== inv.id)); window.location.reload(); }
                    }}
                    className="rounded-lg bg-amber-100 p-2 text-amber-700 hover:bg-amber-200 transition-colors" title="Peut-être"
                  ><Bookmark className="h-4 w-4" /></button>
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/plans/invitations/${inv.id}/decline`, { method: "POST" });
                      if (res.ok) setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
                    }}
                    className="rounded-lg bg-red-100 p-2 text-red-700 hover:bg-red-200 transition-colors" title="Refuser"
                  ><XCircle className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="os-card p-8 text-center">
          <CalendarDays className="h-12 w-12 text-[var(--os-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2">
            {search ? t.planFilters.noResults : t.planFilters.noPlansInCity}
          </h3>
          <p className="text-sm text-[var(--os-muted)] mb-6">
            {search ? "Essaye un autre mot-clé ou filtre." : "Lance le premier plan pour remplir ton OUTSIDE."}
          </p>
          {!search && (
            <div className="flex flex-col gap-3 items-center">
              <Link href="/plans/new" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all">
                <Plus className="h-4 w-4" /> Créer un plan
              </Link>
              <InviteCircle compact />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {(() => {
            const now = new Date();
            const endOfToday = new Date();
            endOfToday.setHours(23, 59, 59, 999);
            const endOfTomorrow = new Date();
            endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
            endOfTomorrow.setHours(23, 59, 59, 999);

            const byCity: Record<string, Plan[]> = {};
            filteredPlans.forEach((p) => {
              const city = p.city.name;
              if (!byCity[city]) byCity[city] = [];
              byCity[city].push(p);
            });

            return Object.entries(byCity)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([cityName, cityPlans]) => {
                const tonight: Plan[] = [];
                const tomorrow: Plan[] = [];
                const thisWeek: Plan[] = [];
                const later: Plan[] = [];

                cityPlans.forEach((p) => {
                  const d = new Date(p.startDate);
                  if (d >= now && d <= endOfToday) { tonight.push(p); }
                  else if (d > endOfToday && d <= endOfTomorrow) { tomorrow.push(p); }
                  else if (d.getTime() - now.getTime() < 7 * 86400000) { thisWeek.push(p); }
                  else { later.push(p); }
                });

                const groups = [
                  { label: "Ce soir", plans: tonight },
                  { label: "Demain", plans: tomorrow },
                  { label: "Cette semaine", plans: thisWeek },
                  { label: "Prochains", plans: later },
                ].filter((g) => g.plans.length > 0);

                if (groups.length === 0) return null;

                return (
                  <section key={cityName}>
                    <h2 className="text-lg font-black text-[var(--os-fg)] mb-3 flex items-center gap-2">
                      Plans à {cityName}
                    </h2>
                    <div className="space-y-5">
                      {groups.map((g) => (
                        <div key={g.label}>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)] mb-2">{g.label}</h3>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {g.plans.map((plan) => <PlanCard key={plan.id} plan={plan} showJoin />)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              });
          })()}
        </div>
      )}
      </>
      )}

      {tab === "suggestions" && (
        <>
        {loadingSuggestions ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
        ) : suggestions.length === 0 ? (
          <EmptyState icon={Sparkles} title={t.planFilters.noSuggestions} description="Personnalise tes préférences pour recevoir des suggestions personnalisées." cta={{ label: "Modifier mes préférences", href: "/settings" }} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{suggestions.map((plan) => <PlanCard key={plan.id} plan={plan} showJoin />)}</div>
        )}
        </>
      )}

      {tab === "mes-plans" && (
        <>
        {loadingMyPlans ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
        ) : myPlansData.length === 0 ? (
          <EmptyState icon={CalendarDays} title={t.planFilters.noPlansCreated} description="Tu n'as pas encore créé de plan." cta={{ label: "Créer un plan", href: "/plans/new" }} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{myPlansData.map((plan) => <PlanCard key={plan.id} plan={plan} showJoin />)}</div>
        )}
        </>
      )}
    </AnimatedPage>
  );
}
