"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Video, Radio, MapPin, Eye, Flag, StopCircle, Play, ArrowLeft, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const LiveKitRoomView = dynamic(
  () => import("@/components/live/livekit-room-view"),
  { ssr: false }
);

interface LiveDetail {
  id: string;
  title: string;
  description?: string;
  status: string;
  city?: string;
  country?: string;
  viewerCount: number;
  startedAt?: string;
  livekitRoomName?: string;
  host: { id: string; name: string | null; image: string | null };
}

export default function LiveDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const id = params.id as string;

  const [live, setLive] = useState<LiveDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [reportText, setReportText] = useState("");
  const [showReport, setShowReport] = useState(false);

  const [tokenData, setTokenData] = useState<{ token: string; url: string; roomName: string } | null>(null);
  const [inRoom, setInRoom] = useState(false);

  const isHost = session?.user?.id === live?.host.id;
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";

  useEffect(() => {
    fetch(`/api/lives/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.live) setLive(data.live);
        else setError("Live introuvable.");
        setLoading(false);
      })
      .catch(() => {
        setError("Erreur de chargement.");
        setLoading(false);
      });
  }, [id]);

  async function fetchToken(mode: "host" | "viewer") {
    setActionLoading(true);
    setError("");

    // Host : pré-vérification permissions caméra/micro
    if (mode === "host" && typeof navigator !== "undefined" && navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch (err: unknown) {
        setActionLoading(false);
        const e = err as Error;
        if (e.name === "NotAllowedError" || e.message?.includes("Permission")) {
          setError("Autorise la caméra et le micro pour lancer ton live.");
        } else if (e.name === "NotFoundError") {
          setError("Aucune caméra ou aucun micro détecté.");
        } else if (e.name === "NotReadableError" || e.message?.includes("in use")) {
          setError("Ta caméra ou ton micro est déjà utilisé par une autre application.");
        } else {
          setError("Impossible d'accéder à la caméra ou au micro.");
        }
        return;
      }
    }

    try {
      const res = await fetch(`/api/lives/${id}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || "Erreur.");
        return;
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[LIVE_VIEW]", {
          hasToken: Boolean(json.token),
          hasUrl: Boolean(json.url),
          roomName: json.roomName,
          mode: json.mode,
          isHost: json.isHost,
        });
      }

      setTokenData({ token: json.token, url: json.url, roomName: json.roomName });
      setInRoom(true);
      // Mettre à jour le live si le host démarre
      if (mode === "host" && live?.status === "SCHEDULED") {
        setLive((prev) => (prev ? { ...prev, status: "LIVE" } : prev));
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setActionLoading(false);
    }
  }

  async function endLive() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/lives/${id}/end`, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.live) {
        setLive(json.live);
        setInRoom(false);
        setTokenData(null);
      } else {
        setError(json.message || "Erreur.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setActionLoading(false);
    }
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reportText.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/lives/${id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportText }),
      });
      if (res.ok) {
        setShowReport(false);
        setReportText("");
        alert("Signalement envoyé.");
      } else {
        const json = await res.json();
        setError(json.error || "Erreur.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <AnimatedPage className="p-4 max-w-3xl mx-auto text-center pt-12">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-outside-500" />
      </AnimatedPage>
    );
  }

  if (!live) {
    return (
      <AnimatedPage className="p-4 max-w-3xl mx-auto text-center pt-12">
        <p className="text-sm text-[var(--os-muted)]">{error || "Live introuvable."}</p>
        <Link href="/live" className="mt-4 inline-block text-sm font-bold text-outside-600">
          Retour aux lives
        </Link>
      </AnimatedPage>
    );
  }

  // Mode plein écran live
  if (inRoom && tokenData) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}>
        <LiveKitRoomView
          token={tokenData.token}
          serverUrl={tokenData.url}
          roomName={tokenData.roomName}
          isHost={!!isHost}
          onDisconnected={() => {
            setInRoom(false);
            setTokenData(null);
          }}
        />
      </div>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-3xl mx-auto space-y-6">
      <div style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom))' }}>
      <Link href="/live" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div className="os-card overflow-hidden">
        {/* Player placeholder */}
        <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center">
          <Video className="h-12 w-12 text-white/20 mb-3" />
          <p className="text-sm font-bold text-white/50">
            {live.status === "LIVE"
              ? "Ce live est en cours."
              : live.status === "ENDED"
              ? "Ce live est terminé."
              : "Le live n'a pas encore commencé."}
          </p>
          {live.status === "LIVE" && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold text-white uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              En direct
            </span>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black text-[var(--os-fg)]">{live.title}</h1>
              {live.description && (
                <p className="text-sm text-[var(--os-muted)] mt-1">{live.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 text-[var(--os-muted)]">
              <Eye className="h-4 w-4" />
              <span className="text-xs font-bold">{live.viewerCount}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--os-muted)]">
            {live.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {live.city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Radio className="h-3.5 w-3.5" />
              {live.status === "LIVE" ? "En direct" : live.status === "SCHEDULED" ? "Prévu" : "Terminé"}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-[var(--os-card-border)]">
            <div className="h-8 w-8 rounded-full bg-outside-100 flex items-center justify-center text-xs font-bold text-outside-700">
              {live.host.name?.charAt(0) || "?"}
            </div>
            <span className="text-sm font-bold text-[var(--os-fg)]">{live.host.name || "Anonyme"}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {isHost && live.status === "SCHEDULED" && (
              <button
                onClick={() => fetchToken("host")}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-60"
              >
                <Play className="h-4 w-4" />
                Démarrer le live
              </button>
            )}
            {isHost && live.status === "LIVE" && (
              <button
                onClick={endLive}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                <StopCircle className="h-4 w-4" />
                Terminer
              </button>
            )}
            {!isHost && live.status === "LIVE" && (
              <button
                onClick={() => fetchToken("viewer")}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-60"
              >
                <Radio className="h-4 w-4" />
                Regarder le live
              </button>
            )}
            {!isHost && live.status === "SCHEDULED" && (
              <p className="text-sm text-[var(--os-muted)]">
                Ce live n&apos;a pas encore commencé.
              </p>
            )}
            {isAdmin && live.status !== "BLOCKED" && (
              <button
                onClick={() => {
                  fetch(`/api/lives/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "BLOCKED" }),
                  }).then((r) => {
                    if (r.ok) setLive((prev) => (prev ? { ...prev, status: "BLOCKED" } : prev));
                  });
                }}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                <StopCircle className="h-4 w-4" />
                Bloquer
              </button>
            )}
            {!isHost && (
              <button
                onClick={() => setShowReport(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--os-card-border)] px-4 py-2 text-sm font-bold text-[var(--os-muted)] hover:bg-[var(--os-card-border)] transition-colors"
              >
                <Flag className="h-4 w-4" />
                Signaler
              </button>
            )}
          </div>

          {showReport && (
            <form onSubmit={submitReport} className="space-y-2 pt-2">
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Pourquoi signales-tu ce live ?"
                rows={3}
                className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  Envoyer
                </button>
                <button
                  type="button"
                  onClick={() => setShowReport(false)}
                  className="rounded-full border border-[var(--os-card-border)] px-4 py-2 text-xs font-bold text-[var(--os-muted)] hover:bg-[var(--os-card-border)] transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}

          {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
        </div>
      </div>
      </div>
    </AnimatedPage>
  );
}
