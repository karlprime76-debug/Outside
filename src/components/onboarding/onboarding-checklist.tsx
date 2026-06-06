"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Circle, Sparkles, MapPin, Users, Bookmark, Image as ImageIcon, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OnboardingProgress {
  hasProfilePhoto: boolean;
  hasActiveCity: boolean;
  hasFollowedUsers: boolean;
  hasSavedPlan: boolean;
  hasViewedMoment: boolean;
  hasActivatedStatus: boolean;
  completedAt: string | null;
}

const STEPS = [
  { key: "hasProfilePhoto", label: "Ajouter une photo", icon: ImageIcon, action: "/profile/edit" },
  { key: "hasActiveCity", label: "Choisir ta ville", icon: MapPin, action: "/settings" },
  { key: "hasFollowedUsers", label: "Suivre 3 comptes", icon: Users, action: "/users/suggestions" },
  { key: "hasSavedPlan", label: "Sauvegarder un plan", icon: Bookmark, action: "/plans" },
  { key: "hasViewedMoment", label: "Voir un Moment", icon: ImageIcon, action: "/moments" },
  { key: "hasActivatedStatus", label: "Activer ton statut", icon: Zap, action: "/home" },
];

export function OnboardingChecklist() {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data) => {
        setProgress(data.progress);
        setCompleted(!!data.progress?.completedAt);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !progress || completed) {
    return null;
  }

  const completedCount = STEPS.filter((step) => progress[step.key as keyof OnboardingProgress]).length;
  const progressPercent = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-outside-500" />
          <h3 className="font-bold text-[var(--os-fg)]">Complète ton OUTSIDE</h3>
          <Badge variant="outline">{completedCount}/{STEPS.length}</Badge>
        </div>
        <div className="text-xs font-bold text-outside-600">{progressPercent}%</div>
      </div>

      <div className="space-y-2">
        {STEPS.map((step) => {
          const isCompleted = progress[step.key as keyof OnboardingProgress];
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                isCompleted
                  ? "bg-green-50/50 border border-green-200 dark:bg-green-950/20 dark:border-green-800"
                  : "bg-zinc-50/50 border border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-3">
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-[var(--os-muted)] shrink-0" />
                )}
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[var(--os-muted)]" />
                  <span className="text-sm font-medium text-[var(--os-fg)]">{step.label}</span>
                </div>
              </div>
              {!isCompleted && (
                <button
                  onClick={() => (window.location.href = step.action)}
                  className="text-xs font-bold text-outside-600 hover:text-outside-700 transition-colors"
                >
                  Faire
                </button>
              )}
            </div>
          );
        })}
      </div>

      {completedCount === STEPS.length && (
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-outside-500/10 to-accent-500/10 border border-outside-200 text-center">
          <p className="text-sm font-bold text-outside-700">🎉 Profil lancé !</p>
          <p className="text-xs text-outside-600 mt-1">Tu as complété ton OUTSIDE</p>
        </div>
      )}
    </div>
  );
}
