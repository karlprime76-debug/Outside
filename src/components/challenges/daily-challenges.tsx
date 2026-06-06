"use client";

import { useEffect, useState } from "react";
import { Trophy, CheckCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Challenge {
  id: string;
  key: string;
  title: string;
  description: string;
  rewardLabel: string;
  completed: boolean;
  completedAt?: string | null;
}

export function DailyChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/challenges/daily")
      .then((r) => r.json())
      .then((data) => {
        setChallenges(data.challenges || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const completeChallenge = async (challengeKey: string) => {
    await fetch("/api/challenges/daily", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeKey }),
    });
    setChallenges((prev) =>
      prev.map((c) =>
        c.key === challengeKey ? { ...c, completed: true, completedAt: new Date().toISOString() } : c
      )
    );
  };

  if (loading) {
    return <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 animate-pulse" />;
  }

  if (challenges.length === 0) {
    return null;
  }

  const completedCount = challenges.filter((c) => c.completed).length;

  return (
    <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-outside-500" />
          <h3 className="font-bold text-[var(--os-fg)]">Défis du jour</h3>
          <Badge variant="outline">{completedCount}/{challenges.length}</Badge>
        </div>
        <Sparkles className="h-4 w-4 text-accent-500" />
      </div>

      <div className="space-y-3">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className={`p-3 rounded-lg border transition-all ${
              challenge.completed
                ? "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                : "bg-zinc-50/50 border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-700 hover:border-outside-300"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-[var(--os-fg)]">{challenge.title}</h4>
                <p className="text-xs text-[var(--os-muted)] mt-1">{challenge.description}</p>
                <p className="text-xs font-medium text-outside-600 mt-1">{challenge.rewardLabel}</p>
              </div>
              {challenge.completed ? (
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <button
                  onClick={() => completeChallenge(challenge.key)}
                  className="shrink-0 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-outside-500 to-accent-500 rounded-full hover:shadow-glow transition-all active:scale-95"
                >
                  Compléter
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
