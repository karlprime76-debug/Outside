"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CitySelect } from "@/components/auth/city-select";
import { InputField } from "@/components/ui/input-field";
import { Badge } from "@/components/ui/badge";
import { useDictionary } from "@/hooks/use-dictionary";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getCurrencyForCountry, formatBudget, SUPPORTED_CURRENCIES } from "@/lib/currency";
import { useSession } from "next-auth/react";

const MOODS = [
  "CHILL", "FOOD", "SPORT", "PARTY", "MUSIC", "DATING",
  "FRIENDS", "STUDY", "BUSINESS", "CULTURE", "TRAVEL", "GAMING", "FITNESS"
];

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
const VISIBILITY = ["PUBLIC", "FRIENDS", "FRIENDS_OF_FRIENDS", "CIRCLE", "INVITE_ONLY", "PRIVATE"];
const VISIBILITY_LABELS: Record<string, string> = {
  PUBLIC: "Public",
  FRIENDS: "Amis uniquement",
  FRIENDS_OF_FRIENDS: "Amis d'amis",
  CIRCLE: "Cercle privé",
  INVITE_ONLY: "Sur invitation",
  PRIVATE: "Privé",
};
const SAFETY = ["LOW", "MEDIUM", "HIGH"];

const MOOD_VARIANTS: Record<string, Parameters<typeof Badge>[0]["variant"]> = {
  CHILL: "blue", FOOD: "orange", SPORT: "green", PARTY: "purple",
  MUSIC: "pink", DATING: "pink", FRIENDS: "blue", STUDY: "amber",
  BUSINESS: "slate", CULTURE: "purple", TRAVEL: "green", GAMING: "orange", FITNESS: "green",
};

export default function NewPlanPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useDictionary();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [priceType, setPriceType] = useState<"FREE" | "PAID" | "FROM" | "TICKETED">("FREE");
  const isProOrAdmin = session?.user?.role === "PRO" || session?.user?.role === "ADMIN";
  const [budgetAmount, setBudgetAmount] = useState<number | undefined>(undefined);
  const [selectedCurrency, setSelectedCurrency] = useState("XOF");
  const [circles, setCircles] = useState<{ id: string, name: string }[]>([]);
  const [selectedCircleId, setSelectedCircleId] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  // Update currency when country changes, unless user manually changed it
  const [currencyManuallySet, setCurrencyManuallySet] = useState(false);
  useEffect(() => {
    if (!currencyManuallySet && selectedCountryCode) {
      setSelectedCurrency(getCurrencyForCountry(selectedCountryCode));
    }
  }, [selectedCountryCode, currencyManuallySet]);

  useEffect(() => {
    fetch("/api/circles").then(res => res.json()).then(data => {
      setCircles(data.circles || []);
    }).catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const cityId = form.get("cityId") as string;
    const budgetAmountRaw = form.get("budgetAmount") as string;
    const budgetAmount = priceType === "FREE" ? null : budgetAmountRaw ? parseFloat(budgetAmountRaw) : undefined;

    const data = {
      title: form.get("title") as string,
      description: (form.get("description") as string) || undefined,
      planCategory: form.get("planCategory") as string,
      mood: selectedMood || (form.get("mood") as string),
      priceType,
      budgetLevel: priceType === "FREE" ? "FREE" : "MEDIUM",
      budgetAmount,
      budgetCurrency: selectedCurrency,
      budgetIsFrom: priceType === "FROM",
      isOfficial: form.get("isOfficial") === "on",
      bookingUrl: (form.get("bookingUrl") as string) || undefined,
      cityId,
      countryCode: (form.get("countryCode") as string) || undefined,
      placeId: (form.get("placeId") as string) || undefined,
      neighborhood: (form.get("neighborhood") as string) || undefined,
      startDate: new Date(form.get("startDate") as string).toISOString(),
      endDate: form.get("endDate") ? new Date(form.get("endDate") as string).toISOString() : undefined,
      maxParticipants: parseInt(form.get("maxParticipants") as string) || 10,
      visibility,
      circleId: visibility === "CIRCLE" ? selectedCircleId : undefined,
      isTravelerFriendly: form.get("isTravelerFriendly") === "on",
      safetyLevel: form.get("safetyLevel") as string,
      rules: (form.get("rules") as string) || undefined,
    };

    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Échec de la création");
        setLoading(false);
        return;
      }

      router.push(`/plans/${json.plan.id}`);
    } catch {
      setError(t.common.error);
      setLoading(false);
    }
  }

  const inputBase = "w-full rounded-xl border border-[var(--os-card-border)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 bg-[var(--os-card)] transition-all";

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <Link href="/plans" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {t.newPlan.back}
      </Link>

      <div>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">{t.newPlan.createTitle}</h1>
        <p className="mt-1 text-sm text-[var(--os-muted)]">Crée un plan et fais-le découvrir à ta ville.</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">{error}</div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <InputField name="title" label="Titre" placeholder={t.newPlan.titlePlaceholder} required />
        <div className="animate-fade-in animate-stagger-1">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">Description</label>
          <textarea name="description" placeholder={t.newPlan.descPlaceholder} rows={3} className={inputBase + " resize-none"} />
        </div>

        <div className="animate-stagger-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">Catégorie</label>
            <select name="planCategory" required className={inputBase}>
              <option value="">Choisir une catégorie</option>
              {PLAN_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">Budget</label>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPriceType("FREE")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  priceType === "FREE"
                    ? "bg-outside-500 text-white border-outside-500"
                    : "border-[var(--os-card-border)] text-[var(--os-muted)]"
                }`}
              >
                Gratuit
              </button>
              <button
                type="button"
                onClick={() => setPriceType("PAID")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  priceType === "PAID"
                    ? "bg-outside-500 text-white border-outside-500"
                    : "border-[var(--os-card-border)] text-[var(--os-muted)]"
                }`}
              >
                Payant
              </button>
              <button
                type="button"
                onClick={() => setPriceType("FROM")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  priceType === "FROM"
                    ? "bg-outside-500 text-white border-outside-500"
                    : "border-[var(--os-card-border)] text-[var(--os-muted)]"
                }`}
              >
                À partir de
              </button>
              {isProOrAdmin && (
                <button
                  type="button"
                  onClick={() => setPriceType("TICKETED")}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    priceType === "TICKETED"
                      ? "bg-outside-500 text-white border-outside-500"
                      : "border-[var(--os-card-border)] text-[var(--os-muted)]"
                  }`}
                >
                  Billetterie
                </button>
              )}
            </div>
            {priceType !== "FREE" && (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    name="budgetAmount"
                    type="number"
                    min={0}
                    step={100}
                    placeholder="Montant"
                    className={inputBase + " flex-1 min-w-0"}
                    value={budgetAmount || ""}
                    onChange={(e) => setBudgetAmount(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                  <select
                    value={selectedCurrency}
                    onChange={(e) => { setSelectedCurrency(e.target.value); setCurrencyManuallySet(true); }}
                    className={inputBase + " w-24 shrink-0"}
                  >
                    {SUPPORTED_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {budgetAmount && (
                  <div className="text-xs font-semibold text-outside-600 dark:text-outside-400">
                    {formatBudget(budgetAmount, selectedCurrency, priceType === "FROM", priceType)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="animate-stagger-3">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">{t.newPlan.mood}</label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMood(m)}
                className="transition-all"
              >
                <Badge variant={selectedMood === m ? MOOD_VARIANTS[m] || "default" : "default"}>
                  {m.charAt(0) + m.slice(1).toLowerCase()}
                </Badge>
              </button>
            ))}
          </div>
          <input type="hidden" name="mood" value={selectedMood} required />
        </div>

        <div className="animate-stagger-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">Ville</label>
            <CitySelect name="cityId" required onChange={(_value, countryCode) => {
              setSelectedCountryCode(countryCode);
            }} />
            <input type="hidden" name="countryCode" value={selectedCountryCode} />
          </div>
          <InputField name="neighborhood" label={t.auth.neighborhood} placeholder="Ton quartier" />
        </div>

        <div className="animate-stagger-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">Début</label>
            <input name="startDate" type="datetime-local" required className={inputBase} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">Fin (optionnel)</label>
            <input name="endDate" type="datetime-local" className={inputBase} />
          </div>
        </div>

        <div className="animate-stagger-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">Participants max</label>
            <input name="maxParticipants" type="number" min={2} max={100} defaultValue={10} required className={inputBase} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">Visibilité</label>
            <select
              name="visibility"
              required
              className={inputBase}
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              {VISIBILITY.map((v) => <option key={v} value={v}>{VISIBILITY_LABELS[v]}</option>)}
            </select>
          </div>
        </div>

        {visibility === "CIRCLE" && (
          <div className="animate-fade-in">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">Choisir un cercle</label>
            {circles.length > 0 ? (
              <select
                value={selectedCircleId}
                onChange={(e) => setSelectedCircleId(e.target.value)}
                required
                className={inputBase}
              >
                <option value="">Sélectionner un cercle</option>
                {circles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <div className="p-3 bg-[var(--os-card)] rounded-xl border border-dashed border-[var(--os-card-border)] text-center">
                <p className="text-sm text-[var(--os-muted)]">Tu n&apos;as pas encore de cercle.</p>
                <Link href="/circles" className="text-sm text-outside-500 font-bold hover:underline">
                  Créer un cercle
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="animate-stagger-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">Sécurité</label>
            <select name="safetyLevel" required className={inputBase}>
              {SAFETY.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-3 text-sm text-[var(--os-fg)] mt-6">
            <input name="isTravelerFriendly" type="checkbox" className="rounded h-5 w-5 accent-outside-500" />
            <span className="font-medium">{t.newPlan.travelerFriendly}</span>
          </label>
        </div>

        <div className="animate-stagger-8">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">Règles</label>
          <textarea name="rules" placeholder={t.newPlan.rulesPlaceholder} rows={2} className={inputBase + " resize-none"} />
        </div>

        {isProOrAdmin && (
          <div className="os-card p-4 space-y-4 border-blue-100 bg-blue-50/20 dark:border-blue-900/30 dark:bg-blue-950/10 animate-fade-in">
            <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Options Partenaire / PRO
            </h3>
            
            <label className="flex items-center gap-3 text-sm text-[var(--os-fg)] cursor-pointer">
              <input 
                name="isOfficial" 
                type="checkbox" 
                className="rounded h-5 w-5 accent-blue-500" 
              />
              <span className="font-medium">Certifier ce plan comme Officiel</span>
            </label>

            <div>
              <InputField 
                name="bookingUrl" 
                label="URL de Billetterie / Réservation" 
                placeholder="https://..." 
              />
              <p className="mt-1 text-[10px] text-blue-600/70 dark:text-blue-400/70">
                Le lien vers ta billetterie externe (DICE, Eventbrite, etc.)
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 py-3.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50"
        >
          {loading ? t.newPlan.creating : t.newPlan.createButton}
        </button>
      </form>
    </div>
  );
}
