"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Avatar } from "@/components/ui/avatar";
import { useGlobalAudio } from "@/hooks/use-global-audio";
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  ExternalLink,
  Disc,
  Clock,
  BarChart3,
} from "lucide-react";

interface AudioTrackDetail {
  id: string;
  title: string;
  artistName: string | null;
  audioUrl: string;
  coverUrl: string | null;
  duration: number | null;
  usageCount: number;
  isOfficial: boolean;
  isOriginal: boolean;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  } | null;
}

interface MomentUsingTrack {
  id: string;
  mediaUrl: string;
  caption: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

export default function AudioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addToast } = useToast();
  const { state, play, pause, toggleMute } = useGlobalAudio();

  const [track, setTrack] = useState<AudioTrackDetail | null>(null);
  const [moments, setMoments] = useState<MomentUsingTrack[]>([]);
  const [loading, setLoading] = useState(true);

  const isPlaying = state.src === track?.audioUrl && state.playing;
  const isMuted = state.src === track?.audioUrl ? state.muted : false;

  const fetchData = useCallback(async () => {
    try {
      const [trackRes, momentsRes] = await Promise.all([
        fetch(`/api/audio/${id}`).then((r) => r.ok ? r.json() : null),
        fetch(`/api/audio/${id}/moments`).then((r) => r.ok ? r.json() : { moments: [] }),
      ]);
      setTrack(trackRes?.track || null);
      setMoments(momentsRes.moments || []);
    } catch {
      addToast("Erreur lors du chargement", "error");
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTogglePlay = () => {
    if (!track) return;
    if (isPlaying) {
      pause();
    } else {
      play(track.audioUrl, track.id, track.title, track.artistName || "");
    }
  };

  const formatDuration = (s: number | null) => {
    if (!s) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <AnimatedPage className="p-4 max-w-xl mx-auto space-y-6">
        <div className="h-8 w-32 bg-[var(--os-bg)] rounded animate-pulse" />
        <div className="h-48 w-full bg-[var(--os-bg)] rounded-2xl animate-pulse" />
        <div className="space-y-3">
          <div className="h-4 w-3/4 bg-[var(--os-bg)] rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-[var(--os-bg)] rounded animate-pulse" />
        </div>
      </AnimatedPage>
    );
  }

  if (!track) {
    return (
      <AnimatedPage className="p-4 max-w-xl mx-auto text-center pt-20">
        <Disc className="h-12 w-12 text-[var(--os-muted)] mx-auto mb-3" />
        <p className="text-sm text-[var(--os-muted)]">Son introuvable.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-outside-100 px-4 py-2 text-xs font-bold text-outside-700 hover:bg-outside-200 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour
        </button>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--os-bg)]/90 backdrop-blur-md border-b border-[var(--os-card-border)]">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-full p-2 hover:bg-[var(--os-card-border)] transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5 text-[var(--os-fg)]" />
          </button>
          <p className="text-sm font-bold text-[var(--os-fg)]">Son</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        {/* Cover / Title */}
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-40 h-40 rounded-2xl bg-gradient-to-br from-outside-500/20 to-accent-500/20 flex items-center justify-center shadow-glow">
            {track.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <Music className="h-12 w-12 text-outside-500" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-black text-[var(--os-fg)]">{track.title}</h1>
            {track.artistName && (
              <p className="text-sm text-[var(--os-muted)]">{track.artistName}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <BarChart3 className="h-4 w-4 text-[var(--os-muted)]" />
            <span className="text-sm font-bold text-[var(--os-fg)]">{track.usageCount}</span>
            <span className="text-[10px] text-[var(--os-muted)]">Utilisations</span>
          </div>
          {track.duration && (
            <div className="flex flex-col items-center gap-1">
              <Clock className="h-4 w-4 text-[var(--os-muted)]" />
              <span className="text-sm font-bold text-[var(--os-fg)]">{formatDuration(track.duration)}</span>
              <span className="text-[10px] text-[var(--os-muted)]">Durée</span>
            </div>
          )}
          {track.isOfficial && (
            <div className="flex flex-col items-center gap-1">
              <ExternalLink className="h-4 w-4 text-outside-500" />
              <span className="text-[10px] font-bold text-outside-500">OFFICIEL</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className="rounded-full bg-[var(--os-card)] border border-[var(--os-card-border)] p-3 hover:bg-[var(--os-bg)] transition-colors"
            aria-label={isMuted ? "Activer le son" : "Couper le son"}
          >
            {isMuted ? <VolumeX className="h-5 w-5 text-[var(--os-fg)]" /> : <Volume2 className="h-5 w-5 text-[var(--os-fg)]" />}
          </button>
          <button
            onClick={handleTogglePlay}
            className="rounded-full bg-gradient-to-r from-outside-500 to-accent-500 p-4 text-white shadow-glow hover:shadow-glow-lg transition-all active:scale-95"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-6 w-6 fill-white" /> : <Play className="h-6 w-6 fill-white" />}
          </button>
        </div>

        {/* Owner */}
        {track.owner && (
          <div className="flex items-center gap-2.5 justify-center">
            <Avatar src={track.owner.image} name={track.owner.name} size="sm" />
            <div className="text-left">
              <p className="text-xs font-bold text-[var(--os-fg)]">{track.owner.name || "Anonyme"}</p>
              <p className="text-[10px] text-[var(--os-muted)]">@{track.owner.username || "user"}</p>
            </div>
          </div>
        )}

        {/* Use sound button */}
        <Link
          href={`/moments/new?audioTrackId=${track.id}`}
          className="block w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-center text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
        >
          Utiliser ce son
        </Link>

        {/* Moments using this track */}
        {moments.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-[var(--os-fg)] mb-3">Moments avec ce son</h2>
            <div className="grid grid-cols-3 gap-2">
              {moments.map((m) => (
                <Link key={m.id} href={`/moments?highlight=${m.id}`} className="relative aspect-square rounded-xl overflow-hidden bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.mediaUrl} alt={m.caption || "Moment"} className="w-full h-full object-cover" />
                  <div className="absolute bottom-1 left-1 right-1 flex items-center gap-1">
                    <Avatar src={m.author.image} name={m.author.name} size="sm" />
                    <span className="text-[10px] text-white truncate drop-shadow-md">{m.author.name || m.author.username}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
