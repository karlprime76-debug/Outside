"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Lightbulb, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

interface Tip {
  id: string;
  title: string;
  description: string | null;
  mood: string | null;
  city: string | null;
  active: boolean;
}

export default function AdminTipsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tips, setTips] = useState<Tip[]>([]);
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
    loadTips();
  }, [status, session, router]);

  const loadTips = async () => {
    try {
      const res = await fetch("/api/admin/tips");
      if (res.ok) {
        const data = await res.json();
        setTips(data.tips || []);
      }
    } catch (err) {
      console.error("Load tips failed:", err);
    } finally {
      setLoading(false);
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
          <div className="rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 p-2.5 shadow-glow">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[var(--os-fg)]">Idées de sortie</h1>
        </div>
        <Link
          href="/admin/retention/tips/new"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-sm shadow-glow hover:shadow-glow-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          Nouvelle idée
        </Link>
      </div>

      <div className="space-y-3">
        {tips.map((tip) => (
          <div
            key={tip.id}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {tip.mood && (
                    <span className="px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-medium">
                      {tip.mood}
                    </span>
                  )}
                  {tip.city && (
                    <span className="px-2 py-1 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
                      {tip.city}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-[var(--os-fg)]">{tip.title}</h3>
                {tip.description && (
                  <p className="text-sm text-[var(--os-muted)] mt-1">{tip.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(tip.id)}
                  disabled={deleting === tip.id}
                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                >
                  {deleting === tip.id ? (
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

      {tips.length === 0 && (
        <div className="text-center py-12">
          <Lightbulb className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
          <p className="text-[var(--os-muted)]">Aucune idée de sortie</p>
          <Link
            href="/admin/retention/tips/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-sm"
          >
            <Plus className="h-4 w-4" />
            Créer la première
          </Link>
        </div>
      )}
    </AnimatedPage>
  );
}
