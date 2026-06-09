"use client";

import { useEffect, useRef, useState } from "react";
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
import { useClickOutside } from "@/hooks/use-click-outside";
import { CalendarDays, Plus, SlidersHorizontal, X, Mail, Check, XCircle, Bookmark, MapPin, Sparkles, List, Calendar, ChevronDown } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { ImmersiveBackground } from "@/components/ui/immersive-background";
import { backgrounds } from "@/lib/backgrounds";
import type { Plan } from "@/types/plan";

const MOODS = ["CHILL", "FOOD", "SPORT", "PARTY", "MUSIC", "DATING", "FRIENDS", "STUDY", "BUSINESS", "CULTURE", "TRAVEL", "GAMING", "FITNESS"];
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

type Tab = "tous" | "suggestions" | "mes-plans";

export default function PlansPage() {
  const t = useDictionary();
  const [tab, setTab] = useState<Tab>("tous");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState("");
  const [budget, setBudget] = useState("");
  const [planCategory, setPlanCategory] = useState("");
  const [isFree, setIsFree] = useState("");
  const [priceType, setPriceType] = useState("");
  const [filterFreeToday, setFilterFreeToday] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const priceRef = useRef<HTMLDivElement>(null);
  useClickOutside(priceRef, () => setPriceOpen(false), priceOpen);
  const [nearMe, setNearMe] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("dateAsc");
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
    if (budget) params.set("budgetLevel", budget);
    if (planCategory) params.set("planCategory", planCategory);
    if (isFree) params.set("isFree", isFree);
    if (priceType) params.set("priceType", priceType);
    if (filterFreeToday) params.set("filter", "freeToday");
    if (nearMe) params.set("nearMe", nearMe);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (sortBy) params.set("sortBy", sortBy);

    setLoading(true);
    fetch(`/api/plans?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setPlans(data.plans || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [mood, budget, planCategory, isFree, priceType, filterFreeToday, nearMe, dateFrom, dateTo, sortBy]);

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

  const hasFilters = mood || budget || planCategory || isFree || priceType || filterFreeToday || nearMe || dateFrom || dateTo || search;

  const filteredPlans = debouncedSearch
    ? plans.filter((p) =>
        p.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.mood.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.city.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.planCategory.toLowerCase().includes(debouncedSearch.toLowerCase())
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
          value={planCategory}
          onChange={(e) => setPlanCategory(e.target.value)}
          className="rounded-full border border-[var(--os-card-border)] px-4 py-2 text-xs font-semibold bg-[var(--os-card)] text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
        >
          <option value="">Catégorie</option>
          {PLAN_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button
          onClick={() => setFilterFreeToday((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
            filterFreeToday
              ? "border-outside-500 bg-outside-50 text-outside-700"
              : "border-[var(--os-card-border)] bg-[var(--os-card)] text-[var(--os-fg)] hover:bg-[var(--os-card-border)]"
          }`}
        >
          <Calendar className="h-3 w-3" />
          Gratuit aujourd&apos;hui
        </button>
        <div ref={priceRef} className="relative">
          <button
            onClick={() => setPriceOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--os-card-border)] px-4 py-2 text-xs font-semibold bg-[var(--os-card)] text-[var(--os-fg)] hover:bg-[var(--os-card-border)] transition-colors"
          >
            {priceType === "FREE" ? "Gratuit" : priceType === "PAID" ? "Payant" : priceType === "FROM" ? "À partir de" : "Prix"}
            <ChevronDown className={`h-3 w-3 transition-transform ${priceOpen ? "rotate-180" : ""}`} />
          </button>
          {priceOpen && (
            <div className="absolute top-full left-0 mt-1 min-w-[150px] rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-1 shadow-xl z-40">
              {[
                { value: "", label: "Tous" },
                { value: "FREE", label: "Gratuit" },
                { value: "PAID", label: "Payant" },
                { value: "FROM", label: "À partir de" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setPriceType(opt.value); setIsFree(opt.value ? (opt.value === "FREE" ? "true" : "false") : ""); setPriceOpen(false); }}
                  className={`w-full text-left rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    (priceType || (isFree === "true" && opt.value === "FREE") || (isFree === "false" && opt.value === "PAID")) === opt.value
                      ? "bg-outside-50 text-outside-700"
                      : "text-[var(--os-fg)] hover:bg-[var(--os-card-border)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setNearMe(nearMe === "true" ? "" : "true")}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${
            nearMe === "true"
              ? "border-outside-500 bg-outside-50 text-outside-700"
              : "border-[var(--os-card-border)] bg-[var(--os-card)] text-[var(--os-muted)]"
          } focus:outline-none focus:ring-2 focus:ring-outside-500 transition-colors relative`}
        >
          <MapPin className="h-3 w-3" />
          Proche de moi
          {nearMe !== "true" && (
            <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 leading-none border border-white">
              Bientôt
            </span>
          )}
        </button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-full border border-[var(--os-card-border)] px-4 py-2 text-xs font-semibold bg-[var(--os-card)] text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
        >
          <option value="dateAsc">Bientôt</option>
          <option value="priceAsc">Moins cher</option>
          <option value="priceDesc">Plus cher</option>
          <option value="popular">Populaire</option>
          <option value="recent">Récent</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="Du"
          className="rounded-full border border-[var(--os-card-border)] px-4 py-2 text-xs font-semibold bg-[var(--os-card)] text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="Au"
          className="rounded-full border border-[var(--os-card-border)] px-4 py-2 text-xs font-semibold bg-[var(--os-card)] text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
        />
        {hasFilters && (
          <button
            onClick={() => { setMood(""); setBudget(""); setPlanCategory(""); setIsFree(""); setPriceType(""); setFilterFreeToday(false); setNearMe(""); setDateFrom(""); setDateTo(""); setSearch(""); setSortBy("dateAsc"); }}
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
          {planCategory && (
            <Badge variant="slate">{PLAN_CATEGORIES.find(c => c.value === planCategory)?.label || planCategory}</Badge>
          )}
          {priceType === "FREE" && <Badge variant="slate">Gratuit</Badge>}
          {priceType === "PAID" && <Badge variant="slate">Payant</Badge>}
          {priceType === "FROM" && <Badge variant="slate">À partir de</Badge>}
          {filterFreeToday && <Badge variant="green">Gratuit aujourd&apos;hui</Badge>}
          {nearMe === "true" && (
            <Badge variant="slate">Proche de moi</Badge>
          )}
          {(dateFrom || dateTo) && (
            <Badge variant="slate">{dateFrom || "..."} → {dateTo || "..."}</Badge>
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
                      const res = await fetch(`/api/plans/invitations/${inv.id}/accept`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attendance: "GOING" }) });
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
                      const res = await fetch(`/api/plans/invitations/${inv.id}/accept`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attendance: "MAYBE" }) });
                      if (res.ok) {
                        setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
                        window.location.reload();
                      }
                    }}
                    className="rounded-lg bg-amber-100 p-2 text-amber-700 hover:bg-amber-200 transition-colors"
                    title="Peut-être"
                  >
                    <Bookmark className="h-4 w-4" />
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

      {/* Plans organized by city and category */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="os-card p-8 text-center">
          <CalendarDays className="h-12 w-12 text-[var(--os-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2">
            {search ? "Aucun résultat" : "Aucun plan dans ta ville pour le moment"}
          </h3>
          <p className="text-sm text-[var(--os-muted)] mb-6">
            {search ? "Essaye un autre mot-clé ou filtre." : "Lance le premier plan pour remplir ton OUTSIDE."}
          </p>
          {!search && (
            <div className="flex flex-col gap-3 justify-center">
              <Link
                href="/plans/new"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                Créer un plan express
              </Link>
              <Link
                href="/plans?isFree=true"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--os-card-border)] px-5 py-2.5 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 transition-all"
              >
                <Bookmark className="h-4 w-4" />
                Voir les plans gratuits
              </Link>
              <Link
                href="/tonight-assistant"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--os-card-border)] px-5 py-2.5 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                Plan mystère
              </Link>
            </div>
          )}
          {!search && (
            <div className="mt-4">
              <InviteCircle compact />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {(() => {
            const now = new Date();
            const tonight = new Date();
            tonight.setHours(23, 59, 59, 999);
            const weekendStart = new Date();
            weekendStart.setDate(now.getDate() + (6 - now.getDay() + 7) % 7);
            weekendStart.setHours(0, 0, 0, 0);
            const weekendEnd = new Date(weekendStart);
            weekendEnd.setDate(weekendStart.getDate() + 2);
            weekendEnd.setHours(23, 59, 59, 999);

            const byCity: Record<string, Plan[]> = {};
            filteredPlans.forEach((p) => {
              const city = p.city.name;
              if (!byCity[city]) byCity[city] = [];
              byCity[city].push(p);
            });

            const sections: JSX.Element[] = [];
            const usedIds = new Set<string>();

            // Special sections: Free, From, Tonight, Weekend
            const freePlans = filteredPlans.filter((p) =>
              (p.priceType === "FREE" || p.budgetAmount === null || p.budgetAmount === 0) && !usedIds.has(p.id)
            );
            if (freePlans.length > 0) {
              sections.push(
                <section key="free">
                  <h2 className="text-lg font-black text-[var(--os-fg)] mb-3">Gratuits</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {freePlans.map((plan) => (
                      <PlanCard key={plan.id} plan={plan} showJoin />
                    ))}
                  </div>
                </section>
              );
              freePlans.forEach((p) => usedIds.add(p.id));
            }

            const fromPlans = filteredPlans.filter((p) =>
              (p.priceType === "FROM" || p.budgetIsFrom) && !usedIds.has(p.id)
            );
            if (fromPlans.length > 0) {
              sections.push(
                <section key="from">
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-lg font-black text-[var(--os-fg)]">À partir de</h2>
                    <Badge variant="slate" className="text-[10px]">Pro</Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {fromPlans.map((plan) => (
                      <PlanCard key={plan.id} plan={plan} showJoin />
                    ))}
                  </div>
                </section>
              );
              fromPlans.forEach((p) => usedIds.add(p.id));
            }

            const tonightPlans = filteredPlans.filter((p) => {
              const d = new Date(p.startDate);
              return d >= now && d <= tonight && !usedIds.has(p.id);
            });
            if (tonightPlans.length > 0) {
              sections.push(
                <section key="tonight">
                  <h2 className="text-lg font-black text-[var(--os-fg)] mb-3">Ce soir</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {tonightPlans.map((plan) => (
                      <PlanCard key={plan.id} plan={plan} showJoin />
                    ))}
                  </div>
                </section>
              );
              tonightPlans.forEach((p) => usedIds.add(p.id));
            }

            const weekendPlans = filteredPlans.filter((p) => {
              const d = new Date(p.startDate);
              return d >= weekendStart && d <= weekendEnd && !usedIds.has(p.id);
            });
            if (weekendPlans.length > 0) {
              sections.push(
                <section key="weekend">
                  <h2 className="text-lg font-black text-[var(--os-fg)] mb-3">Ce week-end</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {weekendPlans.map((plan) => (
                      <PlanCard key={plan.id} plan={plan} showJoin />
                    ))}
                  </div>
                </section>
              );
              weekendPlans.forEach((p) => usedIds.add(p.id));
            }

            // City sections with categories
            Object.entries(byCity).forEach(([cityName, cityPlans]) => {
              const remaining = cityPlans.filter((p) => !usedIds.has(p.id));
              if (remaining.length === 0) return;

              const byCategory: Record<string, Plan[]> = {};
              remaining.forEach((p) => {
                const cat = p.planCategory || "AUTRE";
                if (!byCategory[cat]) byCategory[cat] = [];
                byCategory[cat].push(p);
              });

              sections.push(
                <section key={cityName}>
                  <h2 className="text-lg font-black text-[var(--os-fg)] mb-1">Plans à {cityName}</h2>
                  <div className="space-y-4">
                    {Object.entries(byCategory).map(([cat, catPlans]) => {
                      const catLabel = PLAN_CATEGORIES.find((c) => c.value === cat)?.label || cat;
                      return (
                        <div key={cat}>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)] mb-2">{catLabel}</h3>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {catPlans.map((plan) => (
                              <PlanCard key={plan.id} plan={plan} showJoin />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            });

            return sections;
          })()}
        </div>
      )}
      </>
      )}

      {tab === "suggestions" && (
        <>
        {loadingSuggestions ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : suggestions.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Aucune suggestion"
            description="Personnalise tes préférences pour recevoir des suggestions personnalisées."
            cta={{ label: "Modifier mes préférences", href: "/settings" }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((plan) => (
              <PlanCard key={plan.id} plan={plan} showJoin />
            ))}
          </div>
        )}
        </>
      )}

      {tab === "mes-plans" && (
        <>
        {loadingMyPlans ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : myPlansData.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Aucun plan créé"
            description="Tu n'as pas encore créé de plan."
            cta={{ label: "Créer un plan", href: "/plans/new" }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myPlansData.map((plan) => (
              <PlanCard key={plan.id} plan={plan} showJoin />
            ))}
          </div>
        )}
        </>
      )}
    </AnimatedPage>
  );
}
