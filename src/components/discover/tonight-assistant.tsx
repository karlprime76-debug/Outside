"use client";

import { useState } from "react";
import { getUserLocale } from "@/lib/locale";
import { Sparkles, Coffee, Dumbbell, Music, PartyPopper, BookOpen, Briefcase, Plane, Users, Calendar } from "lucide-react";
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

const TIMINGS = [
  { label: "Ce soir", value: "tonight" },
  { label: "Ce week-end", value: "weekend" },
];

interface Suggestion {
  type: string;
  title: string;
  description: string;
  actionUrl: string;
}

interface SearchResult {
  recommendedPlans: Array<{
    id: string;
    title: string;
    startDate: string;
    creator: {
      name: string | null;
      username: string | null;
      image: string | null;
    };
  }>;
  availableUsers: Array<{
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  }>;
  suggestions: Suggestion[];
}

export function TonightAssistant() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [selectedTiming, setSelectedTiming] = useState<string>("tonight");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const handleSearch = async () => {
    if (!selectedMood) return;

    setLoading(true);
    try {
      const res = await fetch("/api/discover/tonight-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: selectedMood,
          budget: selectedBudget,
          timing: selectedTiming,
        }),
      });
      const data = await res.json();
      setResults(data);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("[TONIGHT_ASSISTANT_ERROR]", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-outside-500" />
          <h3 className="font-bold text-[var(--os-fg)]">Que faire ce soir ?</h3>
        </div>
        <Badge variant="outline">Assistant</Badge>
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
                    ? "bg-gradient-to-r from-outside-500 to-accent-500 text-white shadow-glow"
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
                    ? "bg-gradient-to-r from-outside-500 to-accent-500 text-white shadow-glow"
                    : "bg-[var(--os-bg)] border border-[var(--os-card-border)] text-[var(--os-fg)] hover:border-accent-300"
                }`}
              >
                {budget.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timing selection */}
        <div>
          <p className="text-sm font-medium text-[var(--os-fg)] mb-2">Quand ?</p>
          <div className="flex flex-wrap gap-2">
            {TIMINGS.map((timing) => (
              <button
                key={timing.value}
                onClick={() => setSelectedTiming(timing.value)}
                className={`px-3 py-2 rounded-full text-xs font-bold transition-all ${
                  selectedTiming === timing.value
                    ? "bg-gradient-to-r from-outside-500 to-accent-500 text-white shadow-glow"
                    : "bg-[var(--os-bg)] border border-[var(--os-card-border)] text-[var(--os-fg)] hover:border-accent-300"
                }`}
              >
                {timing.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search button */}
        <button
          onClick={handleSearch}
          disabled={!selectedMood || loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 text-white font-bold shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Recherche..." : "Trouver des plans"}
        </button>

        {/* Results */}
        {results && (
          <div className="space-y-4 mt-4">
            {/* Plans */}
            {results.recommendedPlans && results.recommendedPlans.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-outside-500" />
                  <h4 className="font-semibold text-sm text-[var(--os-fg)]">Plans recommandés</h4>
                </div>
                <div className="space-y-2">
                  {results.recommendedPlans.slice(0, 3).map((plan) => (
                    <div
                      key={plan.id}
                      className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50"
                    >
                      <h5 className="font-medium text-sm text-[var(--os-fg)]">{plan.title}</h5>
                      <p className="text-xs text-[var(--os-muted)] mt-1">
                        par {plan.creator.name} · {new Date(plan.startDate).toLocaleDateString(getUserLocale())}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users available */}
            {results.availableUsers && results.availableUsers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-accent-500" />
                  <h4 className="font-semibold text-sm text-[var(--os-fg)]">Personnes disponibles</h4>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {results.availableUsers.slice(0, 5).map((user) => (
                    <div
                      key={user.id}
                      className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-outside-500 to-accent-500 overflow-hidden">
                        {user.image ? (
                          <img src={user.image} alt={user.name || ""} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold">
                            {user.name?.[0] || "?"}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-[var(--os-fg)] text-center max-w-[80px] truncate">
                        {user.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-accent-500" />
                  <h4 className="font-semibold text-sm text-[var(--os-fg)]">Suggestions</h4>
                </div>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <a
                      key={index}
                      href={suggestion.actionUrl}
                      className="block p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 hover:border-accent-300 transition-colors"
                    >
                      <h5 className="font-medium text-sm text-[var(--os-fg)]">{suggestion.title}</h5>
                      <p className="text-xs text-[var(--os-muted)] mt-1">{suggestion.description}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
