"use client";

import { useEffect, useState } from "react";
import { Music, Loader2, CheckCircle, Ban, Trash2, ShieldAlert, Volume2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface AudioTrackItem {
  id: string;
  title: string;
  artistName: string | null;
  sourceType: string;
  status: string;
  duration: number | null;
  reportCount: number;
  usageCount: number;
  rightsConfirmed: boolean;
  createdAt: string;
  owner: { id: string; name: string | null; username: string | null; image: string | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  PENDING_REVIEW: "En attente",
  BLOCKED: "Bloqué",
  DELETED: "Supprimé",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  PENDING_REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  BLOCKED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  DELETED: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
};

const SOURCE_LABELS: Record<string, string> = {
  OUTSIDE_LIBRARY: "Bibliothèque",
  USER_ORIGINAL: "Utilisateur",
  ARTIST_UPLOAD: "Artiste",
  MOMENT_ORIGINAL: "Moment",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AdminAudioPage() {
  const [tracks, setTracks] = useState<AudioTrackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    fetch("/api/admin/audio")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.tracks) setTracks(data.tracks);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleAction(id: string, action: "block" | "unblock" | "delete") {
    setActionId(id);
    try {
      const res = await fetch("/api/admin/audio", {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        if (action === "delete") {
          setTracks((prev) => prev.filter((t) => t.id !== id));
        } else {
          setTracks((prev) =>
            prev.map((t) =>
              t.id === id
                ? { ...t, status: action === "block" ? "BLOCKED" : "ACTIVE" }
                : t
            )
          );
        }
      }
    } catch {
      // silently fail
    } finally {
      setActionId(null);
    }
  }

  const pendingReview = tracks.filter((t) => t.status === "PENDING_REVIEW").length;
  const filtered = filter === "ALL" ? tracks : tracks.filter((t) => t.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-outside-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 p-2.5 shadow-glow">
          <Music className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[var(--os-fg)]">Pistes audio</h1>
          <p className="text-sm text-[var(--os-muted)]">
            {tracks.length} piste{tracks.length > 1 ? "s" : ""}
            {pendingReview > 0 && ` · ${pendingReview} en attente`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["ALL", "ACTIVE", "PENDING_REVIEW", "BLOCKED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              filter === f
                ? "bg-outside-500 text-white"
                : "bg-[var(--os-card)] text-[var(--os-muted)] border border-[var(--os-card-border)] hover:text-[var(--os-fg)]"
            }`}
          >
            {f === "ALL" ? "Toutes" : STATUS_LABELS[f]}
            {f === "PENDING_REVIEW" && pendingReview > 0 && ` (${pendingReview})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="os-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--os-bg)] border-b border-[var(--os-card-border)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--os-muted)] uppercase">Titre</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--os-muted)] uppercase">Artiste</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--os-muted)] uppercase">Source</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--os-muted)] uppercase">Durée</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--os-muted)] uppercase">Signaux</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--os-muted)] uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--os-muted)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--os-card-border)]">
              {filtered.map((track) => (
                <tr key={track.id} className="hover:bg-[var(--os-bg)]/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-[var(--os-bg)] p-1.5">
                        <Volume2 className="h-4 w-4 text-[var(--os-muted)]" />
                      </div>
                      <div>
                        <p className="font-bold text-[var(--os-fg)] truncate max-w-[200px]">
                          {track.title}
                        </p>
                        {track.owner && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Avatar src={track.owner.image} name={track.owner.name} size="xs" />
                            <span className="text-[10px] text-[var(--os-muted)]">
                              {track.owner.name || track.owner.username}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--os-fg)]">
                    {track.artistName || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-outside-100 dark:bg-outside-900/30 px-2 py-0.5 text-[10px] font-bold text-outside-700 dark:text-outside-300">
                      {SOURCE_LABELS[track.sourceType] || track.sourceType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--os-muted)] text-xs font-mono">
                    {formatDuration(track.duration)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-xs text-[var(--os-muted)]">
                      <span>{track.usageCount} util.</span>
                      {track.reportCount > 0 && (
                        <span className="flex items-center gap-1 text-red-500 font-bold">
                          <ShieldAlert className="h-3 w-3" />
                          {track.reportCount}
                        </span>
                      )}
                      {track.rightsConfirmed ? (
                        <span className="text-emerald-500">✓ droits</span>
                      ) : (
                        <span className="text-amber-500">? droits</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[track.status] || STATUS_COLORS.ACTIVE}`}>
                      {STATUS_LABELS[track.status] || track.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {track.status !== "ACTIVE" && (
                        <button
                          onClick={() => handleAction(track.id, "unblock")}
                          disabled={actionId === track.id}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-40"
                          title="Réactiver"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {track.status !== "BLOCKED" && (
                        <button
                          onClick={() => handleAction(track.id, "block")}
                          disabled={actionId === track.id}
                          className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                          title="Bloquer"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(track.id, "delete")}
                        disabled={actionId === track.id}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--os-muted)]">
                    Aucune piste audio
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
