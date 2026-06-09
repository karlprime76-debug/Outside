"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CitySelect } from "@/components/auth/city-select";
import { InputField } from "@/components/ui/input-field";
import { Badge } from "@/components/ui/badge";
import { useDictionary } from "@/hooks/use-dictionary";
import { ArrowLeft } from "lucide-react";
import { getCurrencyForCountry, formatBudget, SUPPORTED_CURRENCIES } from "@/lib/currency";

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
const VISIBILITY = ["PUBLIC", "FRIENDS", "FRIENDS_OF_FRIENDS", "INVITE_ONLY", "PRIVATE"];
const VISIBILITY_LABELS: Record<string, string> = {
  PUBLIC: "Public",
  FRIENDS: "Amis uniquement",
  FRIENDS_OF_FRIENDS: "Amis d'amis",
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
  const t = useDictionary();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [budgetMode, setBudgetMode] = useState<"free" | "exact">("exact");
  const [budgetIsFrom, setBudgetIsFrom] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState<number | undefined>(undefined);
  const [selectedCurrency, setSelectedCurrency] = useState("XOF");
  // Update currency when country changes, unless user manually changed it
  const [currencyManuallySet, setCurrencyManuallySet] = useState(false);
  useEffect(() => {
    if (!currencyManuallySet && selectedCountryCode) {
      setSelectedCurrency(getCurrencyForCountry(selectedCountryCode));
    }
  }, [selectedCountryCode, currencyManuallySet]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const cityId = form.get("cityId") as string;
    const budgetAmountRaw = form.get("budgetAmount") as string;
    const budgetAmount = budgetMode === "free" ? 0 : budgetAmountRaw ? parseFloat(budgetAmountRaw) : undefined;

    const data = {
      title: form.get("title") as string,
      description: (form.get("description") as string) || undefined,
      planCategory: form.get("planCategory") as string,
      mood: selectedMood || (form.get("mood") as string),
      budgetLevel: budgetMode === "free" ? "FREE" : "MEDIUM",
      budgetAmount,
      budgetCurrency: selectedCurrency,
      budgetIsFrom: budgetMode !== "free" && budgetIsFrom,
      cityId,
      countryCode: (form.get("countryCode") as string) || undefined,
      placeId: (form.get("placeId") as string) || undefined,
      neighborhood: (form.get("neighborhood") as string) || undefined,
      startDate: new Date(form.get("startDate") as string).toISOString(),
      endDate: form.get("endDate") ? new Date(form.get("endDate") as string).toISOString() : undefined,
      maxParticipants: parseInt(form.get("maxParticipants") as string) || 10,
      visibility: form.get("visibility") as string,
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
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setBudgetMode("free")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  budgetMode === "free"
                    ? "bg-outside-500 text-white border-outside-500"
                    : "border-[var(--os-card-border)] text-[var(--os-muted)]"
                }`}
              >
                Gratuit
              </button>
              <button
                type="button"
                onClick={() => setBudgetMode("exact")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  budgetMode === "exact"
                    ? "bg-outside-500 text-white border-outside-500"
                    : "border-[var(--os-card-border)] text-[var(--os-muted)]"
                }`}
              >
                Montant
              </button>
            </div>
            {budgetMode === "exact" && (
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
                <label className="flex items-center gap-2 text-xs text-[var(--os-muted)]">
                  <input
                    type="checkbox"
                    checked={budgetIsFrom}
                    onChange={(e) => setBudgetIsFrom(e.target.checked)}
                    className="rounded accent-outside-500"
                  />
                  À partir de ce montant
                </label>
                {budgetAmount && (
                  <div className="text-xs font-semibold text-outside-600 dark:text-outside-400">
                    {formatBudget(budgetAmount, selectedCurrency, budgetIsFrom)}
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
            <select name="visibility" required className={inputBase}>
              {VISIBILITY.map((v) => <option key={v} value={v}>{VISIBILITY_LABELS[v]}</option>)}
            </select>
          </div>
        </div>

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
