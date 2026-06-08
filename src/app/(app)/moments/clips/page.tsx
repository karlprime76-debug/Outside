"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Share2,
  ArrowLeft,
  Volume2,
  VolumeX,
  MoreHorizontal,
  Flag,
  Trash2,
  Sparkles,
  Music,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { MomentCommentsSheet } from "@/components/moments/moment-comments-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useMomentPolling } from "@/hooks/use-moment-polling";

interface ClipAuthor {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  role: string;
  isVerified: boolean;
}

interface ClipItem {
  id: string;
  type: string;
  mediaUrl: string;
  caption: string | null;
  city: string | null;
  countryCode: string | null;
  visibility: string;
  createdAt: string;
  author: ClipAuthor;
  _count: { likes: number; comments: number };
  viewerState: {
    likedByMe: boolean;
    canDelete: boolean;
    canReport: boolean;
  };
  audioTrack?: {
    id: string;
    title: string;
    artistName: string | null;
    audioUrl: string;
  } | null;
}

export default function ClipsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startId = searchParams.get("start");
  const scope = (searchParams.get("scope") as string) || "for-you";
  const { addToast } = useToast();

  const [clips, setClips] = useState<ClipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [commentMomentId, setCommentMomentId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const sentThresholdsRef = useRef<Record<number, Set<number>>>({});
  const startTimeRef = useRef<Record<number, number | null>>({});
  const playCountRef = useRef<Record<number, number>>({});
  const isFetchingRef = useRef(false);

  const { newMoments, hasNew, clearNew } = useMomentPolling({
    scope,
    media: "clips",
    enabled: !loading && clips.length > 0,
  });

  const handleInjectNew = useCallback(() => {
    if (newMoments.length === 0) return;
    const existingIds = new Set(clips.map((c) => c.id));
    const trulyNew = newMoments.filter((m) => !existingIds.has(m.id));
    if (trulyNew.length > 0) {
      setClips((prev) => [...trulyNew, ...prev]);
      // Scroll to first new clip
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
    clearNew();
  }, [newMoments, clips, clearNew]);

  const fetchClips = useCallback(
    async (cursor?: string) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setLoading(true);
      try {
        const url = new URL("/api/moments", window.location.origin);
        url.searchParams.set("media", "clips");
        url.searchParams.set("scope", scope);
        url.searchParams.set("limit", "10");
        if (cursor) url.searchParams.set("cursor", cursor);

        const res = await fetch(url.toString());
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");

        const items: ClipItem[] = data.moments || [];
        setClips((prev) => (cursor ? [...prev, ...items] : items));
        setNextCursor(data.nextCursor || null);

        if (!cursor && startId && items.length > 0) {
          const idx = items.findIndex((i) => i.id === startId);
          if (idx >= 0) setActiveIndex(idx);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [scope, startId]
  );

  useEffect(() => {
    fetchClips();
  }, [fetchClips]);

  // Track video events
  const trackEvent = useCallback((momentId: string, type: string, data?: Record<string, unknown>) => {
    fetch(`/api/moments/${momentId}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...data }),
    }).catch(() => {});
  }, []);

  const handleVideoTimeUpdate = useCallback((index: number) => {
    const video = videoRefs.current[index];
    const clip = clips[index];
    if (!video || !clip) return;

    const currentTime = video.currentTime;
    const duration = video.duration;
    if (!duration) return;

    const percent = (currentTime / duration) * 100;
    const thresholds = sentThresholdsRef.current[index] || new Set<number>();

    // Check thresholds: 25%, 50%, 75%, 90%
    const THRESHOLDS = [25, 50, 75, 90];
    for (const threshold of THRESHOLDS) {
      if (percent >= threshold && !thresholds.has(threshold)) {
        thresholds.add(threshold);
        sentThresholdsRef.current[index] = thresholds;
        trackEvent(clip.id, "VIEW", {
          percent,
          watchMs: Math.round(currentTime * 1000),
        });
      }
    }

    // Check complete view (80%)
    if (percent >= 80 && !thresholds.has(100)) {
      thresholds.add(100);
      sentThresholdsRef.current[index] = thresholds;
      trackEvent(clip.id, "COMPLETE_VIEW", {
        percent,
        watchMs: Math.round(currentTime * 1000),
      });
    }
  }, [clips, trackEvent]);

  const handleVideoPlay = useCallback((index: number) => {
    const clip = clips[index];
    if (!clip) return;

    if (startTimeRef.current[index] === null) {
      startTimeRef.current[index] = Date.now();
    }

    // Track replay (second play)
    playCountRef.current[index] = (playCountRef.current[index] || 0) + 1;
    if (playCountRef.current[index] > 1) {
      trackEvent(clip.id, "REPLAY");
    }
  }, [clips, trackEvent]);

  const handleVideoPause = useCallback((index: number) => {
    const video = videoRefs.current[index];
    const clip = clips[index];
    if (!video || !clip || startTimeRef.current[index] === null) return;

    const watchMs = Date.now() - startTimeRef.current[index];
    const percent = (video.currentTime / video.duration) * 100;

    // Track quick skip (quit within 3 seconds and < 10% watched)
    if (watchMs < 3000 && percent < 10) {
      trackEvent(clip.id, "VIEW", {
        watchMs,
        percent,
        source: "quick_skip",
      });
    }
  }, [clips, trackEvent]);

  const handleVideoEnded = useCallback((index: number) => {
    const video = videoRefs.current[index];
    const clip = clips[index];
    if (!video || !clip) return;

    const percent = (video.currentTime / video.duration) * 100;
    const thresholds = sentThresholdsRef.current[index] || new Set<number>();

    // Ensure complete view is sent
    if (!thresholds.has(100)) {
      thresholds.add(100);
      sentThresholdsRef.current[index] = thresholds;
      trackEvent(clip.id, "COMPLETE_VIEW", {
        percent,
        watchMs: Math.round(video.currentTime * 1000),
      });
    }
  }, [clips, trackEvent]);

  // Attach video event listeners
  useEffect(() => {
    const currentRefs = videoRefs.current;
    Object.entries(currentRefs).forEach(([idxStr, video]) => {
      if (!video) return;
      const idx = parseInt(idxStr, 10);

      video.addEventListener("timeupdate", () => handleVideoTimeUpdate(idx));
      video.addEventListener("play", () => handleVideoPlay(idx));
      video.addEventListener("pause", () => handleVideoPause(idx));
      video.addEventListener("ended", () => handleVideoEnded(idx));
    });

    return () => {
<<<<<<< HEAD
=======
      const currentRefs = videoRefs.current;
>>>>>>> 8c85852 (fix: clean console.log, fix eslint warnings, improve user-quality-score, integrate trip history)
      Object.values(currentRefs).forEach((video) => {
        if (!video) return;
        video.removeEventListener("timeupdate", () => {});
        video.removeEventListener("play", () => {});
        video.removeEventListener("pause", () => {});
        video.removeEventListener("ended", () => {});
      });
    };
  }, [videoRefs, handleVideoTimeUpdate, handleVideoPlay, handleVideoPause, handleVideoEnded]);

  // Pause/play videos based on active index
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([idxStr, video]) => {
      if (!video) return;
      const idx = parseInt(idxStr, 10);
      if (idx === activeIndex) {
        video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
        // Reset tracking state
        sentThresholdsRef.current[idx] = new Set();
        startTimeRef.current[idx] = null;
        playCountRef.current[idx] = 0;
      }
    });
  }, [activeIndex]);

  // IntersectionObserver to track active clip
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(
              (entry.target as HTMLElement).dataset.index || "0",
              10
            );
            setActiveIndex(idx);
          }
        });
      },
      { threshold: 0.6 }
    );

    const children = container.querySelectorAll("[data-clip-item]");
    children.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [clips.length]);

  // Infinite scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const last = container.querySelector("[data-clip-last]");
      if (!last) return;
      const rect = last.getBoundingClientRect();
      if (rect.top < window.innerHeight * 1.5 && nextCursor && !loading) {
        fetchClips(nextCursor);
      }
    };

    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [nextCursor, loading, fetchClips]);


  const handleLike = async (clip: ClipItem) => {
    const newLiked = !clip.viewerState.likedByMe;
    const newCount = newLiked
      ? clip._count.likes + 1
      : Math.max(0, clip._count.likes - 1);

    setClips((prev) =>
      prev.map((c) =>
        c.id === clip.id
          ? {
              ...c,
              viewerState: { ...c.viewerState, likedByMe: newLiked },
              _count: { ...c._count, likes: newCount },
            }
          : c
      )
    );

    try {
      await fetch(`/api/moments/${clip.id}/like`, {
        method: newLiked ? "POST" : "DELETE",
      });
    } catch {
      // revert handled by optimistic update
    }
  };

  const handleShare = async (clip: ClipItem) => {
    const url = `${window.location.origin}/moments/clips?start=${clip.id}`;
    try {
      await navigator.clipboard.writeText(url);
      addToast("Lien copié !", "success");
      trackEvent(clip.id, "SHARE");
    } catch {
      addToast("Impossible de copier", "error");
    }
  };

  const handleProfileOpen = (clip: ClipItem) => {
    trackEvent(clip.id, "PROFILE_OPEN");
  };

  const handleFollow = async (clip: ClipItem) => {
    trackEvent(clip.id, "FOLLOW_FROM_MOMENT");
    // Navigate to profile (follow action is handled on profile page)
    router.push(`/u/${clip.author.username || clip.author.id}`);
  };

  const handleDelete = async (clip: ClipItem) => {
    if (!confirm("Supprimer ce clip ?")) return;
    const res = await fetch(`/api/moments/${clip.id}`, { method: "DELETE" });
    if (res.ok) {
      addToast("Clip supprimé.", "success");
      setClips((prev) => prev.filter((c) => c.id !== clip.id));
    } else {
      addToast("Erreur lors de la suppression.", "error");
    }
  };

  const handleReport = async (clip: ClipItem) => {
    if (!confirm("Signaler ce clip ?")) return;
    const res = await fetch(`/api/moments/${clip.id}/report`, { method: "POST" });
    if (res.ok) addToast("Clip signalé.", "success");
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return "À l'instant";
    if (m < 60) return `Il y a ${m} min`;
    if (h < 24) return `Il y a ${h} h`;
    return `Il y a ${d} j`;
  };

  if (loading && clips.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] bg-black flex flex-col">
        <div className="flex items-center gap-3 p-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
        <Skeleton className="flex-1 rounded-none" />
      </div>
    );
  }

  if (error && clips.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-white/70 text-sm">{error}</p>
          <button
            onClick={() => fetchClips()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-3 pt-safe">
        <button
          onClick={() => router.back()}
          className="rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-bold text-white drop-shadow-md">Clips</p>
        <button
          onClick={() => setMuted((m) => !m)}
          className="rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
          aria-label={muted ? "Activer le son" : "Couper le son"}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>

      {/* Clips scroll container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-hide"
      >
        {/* New clips banner */}
        {hasNew && !loading && clips.length > 0 && (
          <div className="sticky top-0 z-50 flex justify-center pt-3 pb-1">
            <button
              onClick={handleInjectNew}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-xs font-bold text-white shadow-glow animate-fade-in hover:shadow-glow-lg transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Nouveaux clips disponibles
            </button>
          </div>
        )}
        {clips.map((clip, index) => (
          <div
            key={clip.id}
            data-clip-item
            data-index={index}
            data-clip-last={index === clips.length - 1 ? "true" : "false"}
            className="relative h-[100dvh] w-full snap-start flex-shrink-0"
          >
            {/* Video */}
            <video
              ref={(el) => { videoRefs.current[index] = el; }}
              src={clip.mediaUrl}
              className="h-full w-full object-cover"
              muted={muted}
              loop
              playsInline
              preload="metadata"
              onClick={() => {
                const v = videoRefs.current[index];
                if (!v) return;
                if (v.paused) {
                  v.play().catch(() => {});
                } else {
                  v.pause();
                }
              }}
            />

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent pointer-events-none" />

            {/* Right actions */}
            <div className="absolute right-2 bottom-24 sm:bottom-32 flex flex-col items-center gap-5 z-40">
              <button
                onClick={() => handleLike(clip)}
                className="flex flex-col items-center gap-1"
              >
                <div className="rounded-full bg-black/30 backdrop-blur-sm p-2.5 hover:bg-black/50 transition-colors">
                  <Heart
                    className={`h-6 w-6 ${clip.viewerState.likedByMe ? "fill-red-500 text-red-500" : "text-white"}`}
                  />
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-md">
                  {clip._count.likes}
                </span>
              </button>

              <button
                onClick={() => setCommentMomentId(clip.id)}
                className="flex flex-col items-center gap-1"
              >
                <div className="rounded-full bg-black/30 backdrop-blur-sm p-2.5 hover:bg-black/50 transition-colors">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-md">
                  {clip._count.comments}
                </span>
              </button>

              <button
                onClick={() => handleShare(clip)}
                className="flex flex-col items-center gap-1"
              >
                <div className="rounded-full bg-black/30 backdrop-blur-sm p-2.5 hover:bg-black/50 transition-colors">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
              </button>

              <div className="relative">
                <button
                  onClick={() =>
                    setMenuOpenId(menuOpenId === clip.id ? null : clip.id)
                  }
                  className="rounded-full bg-black/30 backdrop-blur-sm p-2.5 hover:bg-black/50 transition-colors"
                >
                  <MoreHorizontal className="h-6 w-6 text-white" />
                </button>
                {menuOpenId === clip.id && (
                  <div className="absolute right-0 bottom-full mb-2 w-44 rounded-xl bg-[var(--os-card)] border border-[var(--os-card-border)] shadow-xl py-1 z-50 animate-fade-in">
                    {clip.viewerState.canDelete && (
                      <button
                        onClick={() => {
                          setMenuOpenId(null);
                          handleDelete(clip);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </button>
                    )}
                    {clip.viewerState.canReport && (
                      <button
                        onClick={() => {
                          setMenuOpenId(null);
                          handleReport(clip);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
                      >
                        <Flag className="h-4 w-4" />
                        Signaler
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setMenuOpenId(null);
                        handleShare(clip);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                      Partager
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 sm:pb-12 z-40">
              {/* Author row */}
              <div className="flex items-center gap-2.5 mb-2">
                <Link href={`/u/${clip.author.username || clip.author.id}`} onClick={() => handleProfileOpen(clip)}>
                  <Avatar src={clip.author.image} name={clip.author.name} size="sm" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/u/${clip.author.username || clip.author.id}`}
                    onClick={() => handleProfileOpen(clip)}
                    className="text-sm font-bold text-white drop-shadow-md truncate block"
                  >
                    {clip.author.name || "Anonyme"}
                    {clip.author.isVerified && (
                      <span className="ml-1 inline-block align-middle">
                        <svg className="h-3.5 w-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 003.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 002.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </Link>
                  <p className="text-xs text-white/70 drop-shadow-md">
                    @{clip.author.username || "user"}
                  </p>
                </div>
                <button
                  onClick={() => handleFollow(clip)}
                  className="rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold text-white hover:bg-white/20 transition-colors"
                >
                  Suivre
                </button>
              </div>

              {clip.audioTrack && (
                <Link
                  href={`/audio/${clip.audioTrack.id}`}
                  className="flex items-center gap-1.5 mb-1.5 group"
                >
                  <Music className="h-3 w-3 text-white/80 group-hover:text-outside-400 transition-colors" />
                  <span className="text-xs text-white/90 drop-shadow-md truncate font-medium group-hover:text-outside-400 transition-colors">
                    {clip.audioTrack.title}
                  </span>
                  {clip.audioTrack.artistName && (
                    <span className="text-[10px] text-white/60 truncate">· {clip.audioTrack.artistName}</span>
                  )}
                </Link>
              )}
              {clip.caption && (
                <p className="text-sm text-white/95 drop-shadow-md line-clamp-2 mb-1 max-w-[80%]">
                  {clip.caption}
                </p>
              )}
              <p className="text-[10px] text-white/50">{timeAgo(clip.createdAt)}</p>
            </div>
          </div>
        ))}

        {/* Loading sentinel */}
        {nextCursor && (
          <div className="h-[100dvh] flex items-center justify-center snap-start">
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        )}
      </div>

      {/* Comments sheet */}
      <MomentCommentsSheet
        momentId={commentMomentId || ""}
        open={!!commentMomentId}
        onClose={() => setCommentMomentId(null)}
      />
    </div>
  );
}
