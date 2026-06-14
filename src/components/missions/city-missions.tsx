"use client";

import { useEffect, useState } from "react";
import { MapPin, CheckCircle, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Mission {
  id: string;
  key: string;
  title: string;
  description: string;
  city?: string | null;
  rewardLabel: string;
  completed: boolean;
  completedAt?: string | null;
}

export function CityMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [city, setCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/missions/city")
      .then((r) => r.json())
      .then((data) => {
        setMissions(data.missions || []);
        setCity(data.city || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const completeMission = async (missionKey: string) => {
    await fetch("/api/missions/city", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionKey }),
    });
    setMissions((prev) =>
      prev.map((m) =>
        m.key === missionKey ? { ...m, completed: true, completedAt: new Date().toISOString() } : m
      )
    );
  };

  if (loading) {
    return <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 animate-pulse" />;
  }

  if (missions.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[var(--os-card-border)] bg-[var(--os-card)] p-8 text-center space-y-3">
        <div className="rounded-full bg-gradient-to-br from-outside-500/10 to-accent-500/10 p-4 w-fit mx-auto">
          <Target className="h-8 w-8 text-outside-400" />
        </div>
        <h3 className="font-bold text-[var(--os-fg)]">Aucune mission pour l&apos;instant</h3>
        <p className="text-sm text-[var(--os-muted)] max-w-xs mx-auto">
          De nouvelles missions apparaîtront bientôt dans ta ville. Reviens nous voir !
        </p>
      </div>
    );
  }

  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-accent-500" />
          <h3 className="font-bold text-[var(--os-fg)]">
            {city ? `Missions à ${city}` : "Missions OUTSIDE"}
          </h3>
          <Badge variant="outline">{completedCount}/{missions.length}</Badge>
        </div>
        <MapPin className="h-4 w-4 text-outside-500" />
      </div>

      <div className="space-y-3">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className={`p-3 rounded-lg border transition-all ${
              mission.completed
                ? "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                : "bg-zinc-50/50 border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-700 hover:border-accent-300"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-[var(--os-fg)]">{mission.title}</h4>
                <p className="text-xs text-[var(--os-muted)] mt-1">{mission.description}</p>
                <p className="text-xs font-medium text-accent-600 mt-1">{mission.rewardLabel}</p>
              </div>
              {mission.completed ? (
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <button
                  onClick={() => completeMission(mission.key)}
                  className="shrink-0 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-accent-500 to-pink-500 rounded-full hover:shadow-glow transition-all active:scale-95"
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
