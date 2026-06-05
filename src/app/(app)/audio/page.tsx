"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatedPage } from "@/components/ui/animated-page";
import { useGlobalAudio } from "@/hooks/use-global-audio";
import { useToast } from "@/components/ui/toast";
import {
  ArrowLeft,
  Music,
  TrendingUp,
  Star,
  User,
  Clock,
  BarChart3,
  Plus,
  Search,
  Disc,
} from "lucide-react";

interface AudioTrackItem {
  id: string;
  title: string;
  artistName: string | null;
  audioUrl: string;
  duration: number | null;
  usageCount: number;
  isOfficial: boolean;
  isOriginal: boolean;
}

export default function AudioDiscoveryPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { state, play, pause } = useGlobalAudio();
  const [activeTab, setActiveTab] = useState<"trends" | "official" | "original" | "artists" | "recent">("trends");
  const [tracks, setTracks] = useState<AudioTrackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "30");
      if (activeTab === "official") params.set("type", "official");
      if (activeTab === "original") params.set("type", "original");
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/audio/tracks?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setTracks(data.tracks || []);
    } catch {
      addToast("Erreur lors du chargement", "error");
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, addToast]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  const filteredTracks = useMemo(() => {
    if (activeTab === "recent") {
      return [...tracks].sort((a, b) => {
        // Sort by recency would need createdAt, so fallback to usage-based
        return (b.usageCount || 0) - (a.usageCount || 0);
      });
    }
    if (activeTab === "trends") {
      return [...tracks].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    }
    if (activeTab === "artists") {
      // Group by artist, return all but display grouped visually
      return [...tracks].sort((a, b) => {
        const artistA = (a.artistName || a.title).toLowerCase();
        const artistB = (b.artistName || b.title).toLowerCase();
        return artistA.localeCompare(artistB);
      });
    }
    return tracks;
  }, [tracks, activeTab]);

  const artists = useMemo(() => {
    const map = new Map<string, AudioTrackItem[]>();
    for (const t of tracks) {
      const key = t.artistName || "Artiste inconnu";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tracks]);

  const handleTogglePlay = (track: AudioTrackItem) => {
    const isPlaying = state.src === track.audioUrl && state.playing;
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

  const tabs = [
    { key: "trends" as const, label: "Tendances", icon: TrendingUp },
    { key: "official" as const, label: "Officiels", icon: Star },
    { key: "original" as const, label: "Originaux", icon: User },
    { key: "artists" as const, label: "Artistes", icon: Disc },
    { key: "recent" as const, label: "Récents", icon: Clock },
  ];

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
          <p className="text-lg font-black text-[var(--os-fg)]">Sons OUTSIDE</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--os-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un son..."
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] pl-9 pr-3 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  isActive
                    ? "bg-gradient-to-r from-outside-500 to-accent-500 text-white shadow-glow"
                    : "bg-[var(--os-card)] text-[var(--os-muted)] border border-[var(--os-card-border)] hover:text-[var(--os-fg)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--os-card)] border border-[var(--os-card-border)] animate-pulse">
                <div className="h-12 w-12 rounded-lg bg-[var(--os-bg)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 rounded bg-[var(--os-bg)]" />
                  <div className="h-2.5 w-20 rounded bg-[var(--os-bg)]" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === "artists" ? (
          /* Artists grouped view */
          <div className="space-y-6">
            {artists.map(([artistName, artistTracks]) => (
              <div key={artistName}>
                <h2 className="text-sm font-bold text-[var(--os-fg)] mb-2 flex items-center gap-1.5">
                  <Disc className="h-3.5 w-3.5 text-outside-500" />
                  {artistName}
                  <span className="text-[10px] text-[var(--os-muted)] font-normal">({artistTracks.length})</span>
                </h2>
                <div className="space-y-1">
                  {artistTracks.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      isPlaying={state.src === track.audioUrl && state.playing}
                      onTogglePlay={() => handleTogglePlay(track)}
                      formatDuration={formatDuration}
                    />
                  ))}
                </div>
              </div>
            ))}
            {artists.length === 0 && (
              <p className="text-center text-sm text-[var(--os-muted)] py-12">Aucun artiste trouvé.</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                isPlaying={state.src === track.audioUrl && state.playing}
                onTogglePlay={() => handleTogglePlay(track)}
                formatDuration={formatDuration}
              />
            ))}
            {filteredTracks.length === 0 && (
              <p className="text-center text-sm text-[var(--os-muted)] py-12">Aucun son trouvé.</p>
            )}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}

/* Sub-component */
function TrackCard({
  track,
  isPlaying,
  onTogglePlay,
  formatDuration,
}: {
  track: AudioTrackItem;
  isPlaying: boolean;
  onTogglePlay: () => void;
  formatDuration: (s: number | null) => string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--os-card)] border border-[var(--os-card-border)] hover:bg-[var(--os-bg)] transition-colors group">
      {/* Cover / Play */}
      <button
        onClick={onTogglePlay}
        className="relative h-12 w-12 rounded-lg bg-gradient-to-br from-outside-500/20 to-accent-500/20 flex items-center justify-center shrink-0 overflow-hidden"
      >
        <Music className="h-5 w-5 text-outside-500" />
        <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity ${isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          {isPlaying ? (
            <svg className="h-4 w-4 text-white fill-current" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
          ) : (
            <svg className="h-4 w-4 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          )}
        </div>
      </button>

      {/* Info */}
      <Link href={`/audio/${track.id}`} className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[var(--os-fg)] truncate">{track.title}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--os-muted)]">
          <span className="truncate">{track.artistName || "Artiste inconnu"}</span>
          <span>·</span>
          <span>{formatDuration(track.duration)}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            <BarChart3 className="h-2.5 w-2.5" />
            {track.usageCount}
          </span>
        </div>
      </Link>

      {/* Use button */}
      <Link
        href={`/moments/new?audioTrackId=${track.id}`}
        className="rounded-full bg-outside-500/10 p-2 hover:bg-outside-500/20 transition-colors shrink-0"
        aria-label="Utiliser ce son"
      >
        <Plus className="h-4 w-4 text-outside-500" />
      </Link>
    </div>
  );
}
