"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { AnimatedPage } from "@/components/ui/animated-page";
import {
  ArrowLeft,
  AlertTriangle,
  Ban,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  ExternalLink,
  BarChart3,
} from "lucide-react";

interface AdminAudioTrack {
  id: string;
  title: string;
  artistName: string | null;
  audioUrl: string;
  duration: number | null;
  usageCount: number;
  reportCount: number;
  status: string;
  isOfficial: boolean;
  isOriginal: boolean;
  rightsConfirmed: boolean;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  } | null;
}

export default function AdminAudioPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [tracks, setTracks] = useState<AdminAudioTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/admin/audio")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setTracks(data?.tracks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleBlock = async (id: string) => {
    try {
      const res = await fetch("/api/admin/audio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "block" }),
      });
      if (res.ok) {
        addToast("Son bloqué.", "success");
        setTracks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: "BLOCKED" } : t))
        );
      } else {
        addToast("Erreur", "error");
      }
    } catch {
      addToast("Erreur réseau", "error");
    }
  };

  const handleUnblock = async (id: string) => {
    try {
      const res = await fetch("/api/admin/audio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "unblock" }),
      });
      if (res.ok) {
        addToast("Son débloqué.", "success");
        setTracks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: "ACTIVE" } : t))
        );
      } else {
        addToast("Erreur", "error");
      }
    } catch {
      addToast("Erreur réseau", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement ce son ?")) return;
    try {
      const res = await fetch("/api/admin/audio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        addToast("Son supprimé.", "success");
        setTracks((prev) => prev.filter((t) => t.id !== id));
      } else {
        addToast("Erreur", "error");
      }
    } catch {
      addToast("Erreur réseau", "error");
    }
  };

  const handlePreview = (track: AdminAudioTrack) => {
    if (playingId === track.id) {
      audioRef[1](null);
      setPlayingId(null);
      return;
    }
    const a = new Audio(track.audioUrl);
    a.volume = 0.5;
    a.onended = () => setPlayingId(null);
    a.play().catch(() => setPlayingId(null));
    setPlayingId(track.id);
  };

  const formatDuration = (s: number | null) => {
    if (!s) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <AnimatedPage className="p-4 max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-[var(--os-bg)] rounded animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-[var(--os-bg)] animate-pulse" />
        ))}
      </AnimatedPage>
    );
  }

  const reportedTracks = tracks.filter((t) => t.reportCount > 0);

  return (
    <AnimatedPage className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin")}
          className="rounded-full p-2 hover:bg-[var(--os-card-border)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[var(--os-fg)]" />
        </button>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">Modération Audio</h1>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="os-card p-4">
          <p className="text-xs font-bold text-[var(--os-muted)] uppercase">Total sons</p>
          <p className="text-2xl font-black text-[var(--os-fg)]">{tracks.length}</p>
        </div>
        <div className="os-card p-4">
          <p className="text-xs font-bold text-[var(--os-muted)] uppercase">Signalés</p>
          <p className="text-2xl font-black text-red-600">{reportedTracks.length}</p>
        </div>
        <div className="os-card p-4">
          <p className="text-xs font-bold text-[var(--os-muted)] uppercase">Bloqués</p>
          <p className="text-2xl font-black text-amber-600">
            {tracks.filter((t) => t.status === "BLOCKED").length}
          </p>
        </div>
      </div>

      {/* Reported tracks */}
      {reportedTracks.length > 0 && (
        <section className="os-card p-5 border-red-200">
          <h2 className="text-sm font-black text-red-600 flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4" />
            Sons signalés
          </h2>
          <div className="space-y-2">
            {reportedTracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                playingId={playingId}
                onPreview={handlePreview}
                onBlock={handleBlock}
                onUnblock={handleUnblock}
                onDelete={handleDelete}
                formatDuration={formatDuration}
              />
            ))}
          </div>
        </section>
      )}

      {/* All tracks */}
      <section className="os-card p-5">
        <h2 className="text-sm font-black text-[var(--os-fg)] mb-4">Tous les sons</h2>
        <div className="space-y-2">
          {tracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              playingId={playingId}
              onPreview={handlePreview}
              onBlock={handleBlock}
              onUnblock={handleUnblock}
              onDelete={handleDelete}
              formatDuration={formatDuration}
            />
          ))}
          {tracks.length === 0 && (
            <p className="text-sm text-[var(--os-muted)]">Aucun son.</p>
          )}
        </div>
      </section>
    </AnimatedPage>
  );
}

function TrackRow({
  track,
  playingId,
  onPreview,
  onBlock,
  onUnblock,
  onDelete,
  formatDuration,
}: {
  track: AdminAudioTrack;
  playingId: string | null;
  onPreview: (t: AdminAudioTrack) => void;
  onBlock: (id: string) => void;
  onUnblock: (id: string) => void;
  onDelete: (id: string) => void;
  formatDuration: (s: number | null) => string;
}) {
  const isBlocked = track.status === "BLOCKED";

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${isBlocked ? "border-red-200 bg-red-50/30" : "border-[var(--os-card-border)] bg-[var(--os-bg)]"}`}>
      <button
        onClick={() => onPreview(track)}
        className="rounded-full bg-[var(--os-card-border)] p-1.5 hover:bg-outside-500/20 transition-colors shrink-0"
      >
        {playingId === track.id ? (
          <Pause className="h-3.5 w-3.5 text-[var(--os-fg)]" />
        ) : (
          <Play className="h-3.5 w-3.5 text-[var(--os-fg)]" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-[var(--os-fg)] truncate">{track.title}</p>
          {isBlocked && (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600 shrink-0">
              BLOQUÉ
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[var(--os-muted)]">
          <span>{track.artistName || "Artiste inconnu"}</span>
          <span>·</span>
          <span>{formatDuration(track.duration)}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            <BarChart3 className="h-2.5 w-2.5" />
            {track.usageCount}
          </span>
          {track.reportCount > 0 && (
            <span className="flex items-center gap-0.5 text-red-500">
              <AlertTriangle className="h-2.5 w-2.5" />
              {track.reportCount}
            </span>
          )}
          {track.owner && (
            <>
              <span>·</span>
              <span>@{track.owner.username}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isBlocked ? (
          <button
            onClick={() => onUnblock(track.id)}
            className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="Débloquer"
          >
            <CheckCircle className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => onBlock(track.id)}
            className="rounded-lg p-2 text-amber-600 hover:bg-amber-50 transition-colors"
            title="Bloquer"
          >
            <Ban className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(track.id)}
          className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition-colors"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <a
          href={`/audio/${track.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg p-2 text-[var(--os-muted)] hover:bg-[var(--os-card-border)] transition-colors"
          title="Voir"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
