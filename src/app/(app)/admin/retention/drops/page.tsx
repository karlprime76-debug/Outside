"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Sparkles, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

interface Drop {
  id: string;
  title: string;
  description: string | null;
  type: string;
  city: string | null;
  active: boolean;
}

export default function AdminDropsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [drops, setDrops] = useState<Drop[]>([]);
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
    loadDrops();
  }, [status, session, router]);

  const loadDrops = async () => {
    try {
      const res = await fetch("/api/admin/drops");
      if (res.ok) {
        const data = await res.json();
        setDrops(data.drops || []);
      }
    } catch (err) {
      console.error("Load drops failed:", err);
    } finally {
      setLoading(false);
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
          <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[var(--os-fg)]">OUTSIDE Drops</h1>
        </div>
        <Link
          href="/admin/retention/drops/new"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 text-white font-bold text-sm shadow-glow hover:shadow-glow-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          Nouveau Drop
        </Link>
      </div>

      <div className="space-y-3">
        {drops.map((drop) => (
          <div
            key={drop.id}
            className="p-4 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)]/50"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded-full bg-outside-100 dark:bg-outside-900/30 text-outside-700 dark:text-outside-300 text-xs font-medium">
                    {drop.type}
                  </span>
                  {drop.city && (
                    <span className="px-2 py-1 rounded-full bg-[var(--os-card)] text-[var(--os-muted)] text-xs font-medium">
                      {drop.city}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-[var(--os-fg)]">{drop.title}</h3>
                {drop.description && (
                  <p className="text-sm text-[var(--os-muted)] mt-1">{drop.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(drop.id)}
                  disabled={deleting === drop.id}
                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                >
                  {deleting === drop.id ? (
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

      {drops.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-[var(--os-muted)] mx-auto mb-4" />
          <p className="text-[var(--os-muted)]">Aucun drop</p>
          <Link
            href="/admin/retention/drops/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 text-white font-bold text-sm"
          >
            <Plus className="h-4 w-4" />
            Créer le premier
          </Link>
        </div>
      )}
    </AnimatedPage>
  );
}
