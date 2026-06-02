"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CitySelect } from "@/components/auth/city-select";
import { InputField } from "@/components/ui/input-field";
import { Badge } from "@/components/ui/badge";
import { useDictionary } from "@/hooks/use-dictionary";
import { ArrowLeft } from "lucide-react";

const MOODS = [
  "CHILL", "FOOD", "SPORT", "PARTY", "MUSIC", "DATING",
  "FRIENDS", "STUDY", "BUSINESS", "CULTURE", "TRAVEL", "GAMING", "FITNESS"
];

const CATEGORIES = [
  "RESTAURANT", "CAFE", "LOUNGE", "MAQUIS", "BEACH", "GYM",
  "CINEMA", "CULTURE", "SPORT", "EVENT", "SHOP", "OTHER"
];

const BUDGETS = ["FREE", "LOW", "MEDIUM", "PREMIUM"];
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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      title: form.get("title") as string,
      description: (form.get("description") as string) || undefined,
      category: form.get("category") as string,
      mood: selectedMood || (form.get("mood") as string),
      budgetLevel: form.get("budgetLevel") as string,
      cityId: form.get("cityId") as string,
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

  const inputBase = "w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 bg-white dark:bg-surface-card dark:border-surface-border dark:text-zinc-100 transition-all";

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Link href="/plans" className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {t.newPlan.back}
      </Link>

      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{t.newPlan.createTitle}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Crée un plan et fais-le découvrir à ta ville.</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">{error}</div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <InputField name="title" label="Titre" placeholder={t.newPlan.titlePlaceholder} required />
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Description</label>
          <textarea name="description" placeholder={t.newPlan.descPlaceholder} rows={3} className={inputBase + " resize-none"} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t.newPlan.selectCategory}</label>
            <select name="category" required className={inputBase}>
              <option value="">{t.newPlan.selectCategory}</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t.newPlan.selectBudget}</label>
            <select name="budgetLevel" required className={inputBase}>
              <option value="">{t.newPlan.selectBudget}</option>
              {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t.newPlan.mood}</label>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Ville</label>
            <CitySelect name="cityId" required />
          </div>
          <InputField name="neighborhood" label={t.auth.neighborhood} placeholder="Ton quartier" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Début</label>
            <input name="startDate" type="datetime-local" required className={inputBase} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Fin (optionnel)</label>
            <input name="endDate" type="datetime-local" className={inputBase} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Participants max</label>
            <input name="maxParticipants" type="number" min={2} max={100} defaultValue={10} required className={inputBase} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Visibilité</label>
            <select name="visibility" required className={inputBase}>
              {VISIBILITY.map((v) => <option key={v} value={v}>{VISIBILITY_LABELS[v]}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Sécurité</label>
            <select name="safetyLevel" required className={inputBase}>
              {SAFETY.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300 mt-6">
            <input name="isTravelerFriendly" type="checkbox" className="rounded h-5 w-5 accent-outside-500" />
            <span className="font-medium">{t.newPlan.travelerFriendly}</span>
          </label>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Règles</label>
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
