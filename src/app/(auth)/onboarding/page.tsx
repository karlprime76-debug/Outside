"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useDictionary } from "@/hooks/use-dictionary";
import { InputField } from "@/components/ui/input-field";
import { Badge } from "@/components/ui/badge";

const MOODS = [
  "CHILL", "FOOD", "SPORT", "PARTY", "MUSIC", "DATING",
  "FRIENDS", "STUDY", "BUSINESS", "CULTURE", "TRAVEL", "GAMING", "FITNESS"
];

const MOOD_VARIANTS: Record<string, Parameters<typeof Badge>[0]["variant"]> = {
  CHILL: "blue", FOOD: "orange", SPORT: "green", PARTY: "purple",
  MUSIC: "pink", DATING: "pink", FRIENDS: "blue", STUDY: "amber",
  BUSINESS: "slate", CULTURE: "purple", TRAVEL: "green", GAMING: "orange", FITNESS: "green",
};

export default function OnboardingPage() {
  const router = useRouter();
  const t = useDictionary();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);

  function toggleMood(mood: string) {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      bio: form.get("bio") as string,
      neighborhood: form.get("neighborhood") as string,
      preferredBudget: form.get("preferredBudget") as string,
      language: form.get("language") as string,
      preferredMoods: selectedMoods,
    };

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Échec de l'enregistrement");
        setLoading(false);
        return;
      }

      router.push("/home");
      router.refresh();
    } catch {
      setError(t.common.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-gradient-to-b from-outside-50/50 to-[var(--os-bg)] py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-outside-500 to-accent-500 shadow-glow flex items-center justify-center">
            <span className="text-lg font-black text-white">O</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--os-fg)]">{t.auth.onboardingTitle}</h1>
          <p className="mt-1 text-sm text-[var(--os-muted)]">{t.auth.onboardingSubtitle}</p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">{error}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">{t.auth.bio}</label>
            <textarea
              name="bio"
              maxLength={160}
              rows={3}
              placeholder="Parle-nous de toi"
              className="w-full rounded-xl border border-[var(--os-card-border)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 bg-[var(--os-card)] text-[var(--os-fg)] transition-all resize-none"
            />
          </div>

          <InputField name="neighborhood" type="text" label={t.auth.neighborhood} placeholder="Ton quartier" />

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">{t.auth.budget}</label>
            <select
              name="preferredBudget"
              className="w-full rounded-xl border border-[var(--os-card-border)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 bg-[var(--os-card)] text-[var(--os-fg)] transition-all"
            >
              <option value="">Sélectionner...</option>
              <option value="FREE">Gratuit</option>
              <option value="LOW">Bas</option>
              <option value="MEDIUM">Moyen</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">{t.auth.interests}</label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((mood) => {
                const isSelected = selectedMoods.includes(mood);
                return (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => toggleMood(mood)}
                    className={`transition-all ${
                      isSelected
                        ? "scale-105"
                        : ""
                    }`}
                  >
                    <Badge variant={isSelected ? MOOD_VARIANTS[mood] || "default" : "default"}>
                      {mood.charAt(0) + mood.slice(1).toLowerCase()}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">{t.auth.language}</label>
            <select
              name="language"
              defaultValue="fr"
              className="w-full rounded-xl border border-[var(--os-card-border)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 bg-[var(--os-card)] text-[var(--os-fg)] transition-all"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 pressable"
          >
            {loading ? t.common.loading : t.auth.saveButton}
          </button>
        </form>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full text-center text-sm text-[var(--os-muted)] hover:text-red-500 transition-colors"
        >
          {t.nav.signOut}
        </button>
      </div>
    </div>
  );
}
