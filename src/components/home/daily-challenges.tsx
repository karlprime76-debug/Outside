"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle, Trophy } from "lucide-react";

interface Challenge {
  id: string;
  key: string;
  title: string;
  description: string | null;
  rewardLabel: string | null;
  completed: boolean;
  completedAt: string | null;
}

export function DailyChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const res = await fetch("/api/challenges");
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges || []);
      }
    } catch {
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  const completeChallenge = async (challengeKey: string) => {
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeKey }),
      });

      if (res.ok) {
        loadChallenges();
      }
    } catch {
    }
  };

  if (loading) {
    return (
      <div className="bg-[var(--os-card)] rounded-2xl p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-[var(--os-card-border)] rounded w-1/3" />
          <div className="h-12 bg-[var(--os-card-border)] rounded" />
        </div>
      </div>
    );
  }

  if (challenges.length === 0) {
    return null;
  }

  const completedCount = challenges.filter((c) => c.completed).length;
  const totalCount = challenges.length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <div className="bg-[var(--os-card)] rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[var(--os-accent)]" />
          <h3 className="font-bold text-[var(--os-fg)]">Défis du jour</h3>
        </div>
        <Badge variant="slate" className="text-xs">
          {completedCount}/{totalCount}
        </Badge>
      </div>

      <div className="h-2 bg-[var(--os-card-border)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--os-accent)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-2">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="flex items-start gap-3 p-3 bg-[var(--os-bg)] rounded-xl"
          >
            {challenge.completed ? (
              <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            ) : (
              <Trophy className="h-5 w-5 text-[var(--os-muted)] mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--os-fg)] text-sm">{challenge.title}</p>
              {challenge.description && (
                <p className="text-xs text-[var(--os-muted)] mt-1">{challenge.description}</p>
              )}
              {challenge.rewardLabel && (
                <p className="text-xs text-[var(--os-accent)] mt-1">{challenge.rewardLabel}</p>
              )}
            </div>
            {!challenge.completed && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => completeChallenge(challenge.key)}
                className="flex-shrink-0"
              >
                Compléter
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
