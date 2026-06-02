"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Video, StopCircle, Play, ArrowLeft, Loader2, Radio, CheckCircle } from "lucide-react";

interface LiveMod {
  id: string;
  title: string;
  status: string;
  city?: string;
  viewerCount: number;
  createdAt: string;
  host: { id: string; name: string | null; email: string };
}

export default function AdminLivesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lives, setLives] = useState<LiveMod[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
      router.push("/home");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/admin/lives")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          setLives(data?.lives || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, session, router]);

  async function updateStatus(id: string, status: string) {
    setActionId(id);
    try {
      const res = await fetch("/api/admin/lives", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setLives((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status } : l))
        );
      }
    } catch {
      // ignore
    } finally {
      setActionId(null);
    }
  }

  if (status === "loading" || loading) {
    return (
      <AnimatedPage className="p-4 max-w-4xl mx-auto text-center pt-12">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-outside-500" />
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-4xl mx-auto space-y-6 pb-24">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Retour admin
      </Link>

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-red-500 to-pink-500 p-2.5 shadow-glow">
          <Video className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-xl font-black text-[var(--os-fg)]">Modérer les lives</h1>
      </div>

      {lives.length === 0 ? (
        <div className="os-card p-8 text-center">
          <p className="text-sm text-[var(--os-muted)]">Aucun live à modérer pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lives.map((live) => (
            <div key={live.id} className="os-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      live.status === "LIVE"
                        ? "bg-red-100 text-red-700"
                        : live.status === "BLOCKED"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {live.status === "LIVE" && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                      {live.status === "LIVE" ? "En direct" : live.status === "BLOCKED" ? "Bloqué" : "Signalé"}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--os-muted)]">
                      {live.city}
                    </span>
                  </div>
                  <h3 className="font-bold text-[var(--os-fg)]">{live.title}</h3>
                  <p className="text-xs text-[var(--os-muted)]">
                    Par {live.host.name || live.host.email} · {new Date(live.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className="text-xs font-bold text-[var(--os-muted)]">
                  {live.viewerCount} vues
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {live.status !== "LIVE" && (
                  <button
                    onClick={() => updateStatus(live.id, "LIVE")}
                    disabled={actionId === live.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Autoriser
                  </button>
                )}
                {live.status === "LIVE" && (
                  <button
                    onClick={() => updateStatus(live.id, "ENDED")}
                    disabled={actionId === live.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors disabled:opacity-60"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Terminer
                  </button>
                )}
                {live.status !== "BLOCKED" && (
                  <button
                    onClick={() => updateStatus(live.id, "BLOCKED")}
                    disabled={actionId === live.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-60"
                  >
                    <StopCircle className="h-3.5 w-3.5" />
                    Bloquer
                  </button>
                )}
                <Link
                  href={`/live/${live.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--os-card-border)] px-3 py-1.5 text-xs font-bold text-[var(--os-muted)] hover:bg-[var(--os-card-border)] transition-colors"
                >
                  <Radio className="h-3.5 w-3.5" />
                  Voir
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
