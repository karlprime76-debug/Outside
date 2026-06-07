"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatedPage } from "@/components/ui/animated-page";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Drop {
  id: string;
  title: string;
  description: string | null;
  type: string;
  city: string | null;
  countryCode: string | null;
  targetUrl: string | null;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

const DROP_TYPES: Record<string, string> = {
  plan_tonight: "Plans ce soir",
  discover_accounts: "Comptes à découvrir",
  challenge_today: "Défi du jour",
  place_test: "Lieu à tester",
  moment_trending: "Moment qui monte",
  plan_free: "Plan gratuit",
  idea_official: "Idée sortie",
};

export default function AdminDropsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("plan_tonight");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
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
    loadDrops();
  }, []);

  const loadDrops = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/drops");
      const data = await res.json();
      setDrops(data.drops || []);
    } catch (error) {
      console.error("[LOAD_DROPS_ERROR]", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !type) return;

    try {
      setCreating(true);
      const res = await fetch("/api/admin/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          city: city || null,
          targetUrl: targetUrl || null,
          active: true,
        }),
      });

      if (res.ok) {
        const { drop } = await res.json();
        setDrops([drop, ...drops]);
        setTitle("");
        setDescription("");
        setCity("");
        setType("plan_tonight");
        setTargetUrl("");
      }
    } catch (error) {
      console.error("[CREATE_DROP_ERROR]", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce drop ?")) return;

    try {
      setDeleting(id);
      const res = await fetch(`/api/admin/drops?id=${id}`, { method: "DELETE" });

      if (res.ok) {
        setDrops(drops.filter((d) => d.id !== id));
      }
    } catch (error) {
      console.error("[DELETE_DROP_ERROR]", error);
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
          <h1 className="text-2xl font-bold">OUTSIDE Drops</h1>
        </div>

        <form onSubmit={handleCreate} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-3">
          <h2 className="font-semibold">Nouveau Drop</h2>
          <input
            type="text"
            placeholder="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
            required
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
          >
            {Object.entries(DROP_TYPES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Ville (optionnel)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
          />
          <input
            type="url"
            placeholder="URL cible (optionnel)"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
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
          <h2 className="font-semibold">Drops ({drops.length})</h2>
          {drops.map((drop) => (
            <div key={drop.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium">{drop.title}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {DROP_TYPES[drop.type]} {drop.city && `• ${drop.city}`}
                </div>
                {drop.description && <div className="text-sm text-slate-500 mt-1">{drop.description}</div>}
              </div>
              <div className="flex gap-2">
                {drop.active ? (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    Actif
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Inactif</Badge>
                )}
                <button
                  onClick={() => handleDelete(drop.id)}
                  disabled={deleting === drop.id}
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
