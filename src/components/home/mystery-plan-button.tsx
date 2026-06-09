"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface MysteryPlanResult {
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

export function MysteryPlanButton() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MysteryPlanResult | null>(null);

  const handleMysteryPlan = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const res = await fetch("/api/plans/mystery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: "CHILL", budget: "medium" }),
      });
      const data = await res.json();
      setResult(data);
      setIsOpen(true);
    } catch (error) {
      console.error("[MYSTERY_PLAN_ERROR]", error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <>
      <button
        onClick={handleMysteryPlan}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm shadow-glow hover:shadow-glow-lg transition-all active:scale-95 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Plan mystère
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-t-2xl w-full max-w-lg p-6 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <h3 className="font-bold text-lg text-[var(--os-fg)]">Plan mystère</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            {result && (
              <div className="space-y-4">
                <p className="text-sm text-[var(--os-muted)]">{result.message}</p>

                {result.type === "existing_plan" && result.plan && (
                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50">
                    <h4 className="font-semibold text-[var(--os-fg)]">{result.plan.title}</h4>
                    <p className="text-xs text-[var(--os-muted)] mt-1">
                      {new Date(result.plan.startDate).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-[var(--os-muted)] mt-1">
                      par {result.plan.creator.name || "Anonyme"}
                    </p>
                  </div>
                )}

                {result.type === "official_idea" && result.idea && (
                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50">
                    <h4 className="font-semibold text-[var(--os-fg)]">{result.idea.title}</h4>
                    <p className="text-sm text-[var(--os-muted)] mt-2">{result.idea.description}</p>
                  </div>
                )}

                {result.type === "create_suggestion" && result.suggestion && (
                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50">
                    <h4 className="font-semibold text-[var(--os-fg)]">{result.suggestion.title}</h4>
                    <p className="text-sm text-[var(--os-muted)] mt-2">{result.suggestion.description}</p>
                  </div>
                )}

                {result.actionUrl && (
                  <a
                    href={result.actionUrl}
                    className="block w-full text-center px-4 py-3 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 text-white font-bold text-sm shadow-glow hover:shadow-glow-lg transition-all"
                  >
                    {result.type === "existing_plan" ? "Voir le plan" : "Créer ce plan"}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
