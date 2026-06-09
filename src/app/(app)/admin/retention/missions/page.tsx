"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Target, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

interface Mission {
  id: string;
  key: string;
  title: string;
  description: string | null;
  rewardLabel: string | null;
  city: string | null;
  active: boolean;
}

export default function AdminMissionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
      router.push("/");
      return;
    }
    loadMissions();
  }, [status, session, router]);

  const loadMissions = async () => {
    try {
      const res = await fetch("/api/admin/missions");
      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions || []);
      }
    } catch (err) {
      console.error("Load missions failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette mission ?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/admin/missions?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMissions(missions.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <AnimatedPage className="p-4 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-accent-500 to-pink-500 p-2.5 shadow-glow">
            <Target className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[var(--os-fg)]">Missions de ville</h1>
        </div>
        <Link
          href="/admin/retention/missions/new"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent-500 to-pink-500 text-white font-bold text-sm shadow-glow hover:shadow-glow-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          Nouvelle mission
        </Link>
      </div>

      <div className="space-y-3">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="p-4 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)]/50"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <code className="px-2 py-1 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 text-xs font-medium">
                    {mission.key}
                  </code>
                  {mission.city && (
                    <span className="px-2 py-1 rounded-full bg-[var(--os-card)] text-[var(--os-muted)] text-xs font-medium">
                      {mission.city}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-[var(--os-fg)]">{mission.title}</h3>
                {mission.description && (
                  <p className="text-sm text-[var(--os-muted)] mt-1">{mission.description}</p>
                )}
                {mission.rewardLabel && (
                  <p className="text-xs font-medium text-accent-600 mt-2">{mission.rewardLabel}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(mission.id)}
                  disabled={deleting === mission.id}
                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                >
                  {deleting === mission.id ? (
                    <Loader2 className="h-4 w-4 text-red-600 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-red-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {missions.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-[var(--os-muted)] mx-auto mb-4" />
          <p className="text-[var(--os-muted)]">Aucune mission</p>
          <Link
            href="/admin/retention/missions/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent-500 to-pink-500 text-white font-bold text-sm"
          >
            <Plus className="h-4 w-4" />
            Créer la première
          </Link>
        </div>
      )}
    </AnimatedPage>
  );
}
