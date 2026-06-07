"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatedPage } from "@/components/ui/animated-page";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Mission {
  id: string;
  key: string;
  title: string;
  description: string;
  city: string | null;
  rewardLabel: string;
  active: boolean;
  createdAt: string;
}

export default function AdminMissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [rewardLabel, setRewardLabel] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
      router.push("/home");
    }
  }, [status, session, router]);

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/missions");
      const data = await res.json();
      setMissions(data.missions || []);
    } catch (error) {
      console.error("[LOAD_MISSIONS_ERROR]", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key || !title) return;

    try {
      setCreating(true);
      const res = await fetch("/api/admin/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          title,
          description,
          city: city || null,
          rewardLabel,
          active: true,
        }),
      });

      if (res.ok) {
        const { mission } = await res.json();
        setMissions([mission, ...missions]);
        setKey("");
        setTitle("");
        setDescription("");
        setCity("");
        setRewardLabel("");
      }
    } catch (error) {
      console.error("[CREATE_MISSION_ERROR]", error);
    } finally {
      setCreating(false);
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
    } catch (error) {
      console.error("[DELETE_MISSION_ERROR]", error);
    } finally {
      setDeleting(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <AnimatedPage>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Missions OUTSIDE</h1>
        </div>

        <form onSubmit={handleCreate} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-3">
          <h2 className="font-semibold">Nouvelle Mission</h2>
          <input
            type="text"
            placeholder="Clé unique (ex: first_moment)"
            value={key}
            onChange={(e) => setKey(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
            required
          />
          <input
            type="text"
            placeholder="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
          />
          <input
            type="text"
            placeholder="Ville (optionnel)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
          />
          <input
            type="text"
            placeholder="Récompense"
            value={rewardLabel}
            onChange={(e) => setRewardLabel(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
          />
          <button
            type="submit"
            disabled={creating}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : <Plus className="w-4 h-4 inline mr-2" />}
            Créer
          </button>
        </form>

        <div className="space-y-2">
          <h2 className="font-semibold">Missions ({missions.length})</h2>
          {missions.map((mission) => (
            <div key={mission.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium">{mission.title}</div>
                <div className="text-xs text-slate-500 font-mono">{mission.key}</div>
                {mission.description && <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{mission.description}</div>}
                <div className="text-xs text-slate-500 mt-1">
                  {mission.city && `Ville: ${mission.city}`}
                  {mission.rewardLabel && ` • Récompense: ${mission.rewardLabel}`}
                </div>
              </div>
              <div className="flex gap-2">
                {mission.active ? (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    Actif
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Inactif</Badge>
                )}
                <button
                  onClick={() => handleDelete(mission.id)}
                  disabled={deleting === mission.id}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AnimatedPage>
  );
}
