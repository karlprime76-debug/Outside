"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatedPage } from "@/components/ui/animated-page";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Tip {
  id: string;
  title: string;
  description: string;
  mood: string | null;
  city: string | null;
  countryCode: string | null;
  actionLabel: string;
  actionUrl: string;
  active: boolean;
  createdAt: string;
}

const MOODS = ["CHILL", "FOOD", "SPORT", "PARTY", "MUSIC", "CULTURE", "BUSINESS"];

export default function AdminTipsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mood, setMood] = useState("");
  const [city, setCity] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [actionUrl, setActionUrl] = useState("");
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
    loadTips();
  }, []);

  const loadTips = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tips");
      const data = await res.json();
      setTips(data.tips || []);
    } catch (error) {
      console.error("[LOAD_TIPS_ERROR]", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !actionUrl) return;

    try {
      setCreating(true);
      const res = await fetch("/api/admin/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          mood: mood || null,
          city: city || null,
          actionLabel,
          actionUrl,
          active: true,
        }),
      });

      if (res.ok) {
        const { tip } = await res.json();
        setTips([tip, ...tips]);
        setTitle("");
        setDescription("");
        setMood("");
        setCity("");
        setActionLabel("");
        setActionUrl("");
      }
    } catch (error) {
      console.error("[CREATE_TIP_ERROR]", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce conseil ?")) return;

    try {
      setDeleting(id);
      const res = await fetch(`/api/admin/tips?id=${id}`, { method: "DELETE" });

      if (res.ok) {
        setTips(tips.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("[DELETE_TIP_ERROR]", error);
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
          <h1 className="text-2xl font-bold">Conseils OUTSIDE</h1>
        </div>

        <form onSubmit={handleCreate} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-3">
          <h2 className="font-semibold">Nouveau Conseil</h2>
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
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
          >
            <option value="">Mood (optionnel)</option>
            {MOODS.map((m) => (
              <option key={m} value={m}>
                {m}
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
            placeholder="Libellé action"
            value={actionLabel}
            onChange={(e) => setActionLabel(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
          />
          <input
            type="url"
            placeholder="URL action"
            value={actionUrl}
            onChange={(e) => setActionUrl(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
            required
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
          <h2 className="font-semibold">Conseils ({tips.length})</h2>
          {tips.map((tip) => (
            <div key={tip.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium">{tip.title}</div>
                {tip.description && <div className="text-sm text-slate-600 dark:text-slate-400">{tip.description}</div>}
                <div className="text-xs text-slate-500 mt-1">
                  {tip.mood && `Mood: ${tip.mood}`}
                  {tip.city && ` • Ville: ${tip.city}`}
                  {tip.actionLabel && ` • Action: ${tip.actionLabel}`}
                </div>
              </div>
              <div className="flex gap-2">
                {tip.active ? (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    Actif
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Inactif</Badge>
                )}
                <button
                  onClick={() => handleDelete(tip.id)}
                  disabled={deleting === tip.id}
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
