"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MomentCard } from "./moment-card";
import { MomentCommentsSheet } from "./moment-comments-sheet";
import { MomentTypeFilter } from "./moment-type-filter";
import { AccountDiscovery } from "./account-discovery";
import { CityActiveDiscovery } from "./city-active-discovery";
import { TopCreatorsDiscovery } from "./top-creators-discovery";
import { Loader2, Camera, Sparkles } from "lucide-react";
import Link from "next/link";
import { OutsideEmptyState } from "@/components/ui/outside-empty-state";
import { useMomentPolling } from "@/hooks/use-moment-polling";

interface Author {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  role: string;
  isVerified: boolean;
}

interface FeedMoment {
  id: string;
  type: string;
  mediaUrl: string;
  caption: string | null;
  city: string | null;
  countryCode: string | null;
  visibility: string;
  createdAt: string;
  author: Author;
  _count: {
    likes: number;
    comments: number;
  };
  viewerState: {
    likedByMe: boolean;
    canDelete: boolean;
    canReport: boolean;
  };
}

type Scope = "for-you" | "city" | "friends" | "following";

const SCOPE_LABELS: Record<Scope, string> = {
  "for-you": "Pour toi",
  city: "Ta ville",
  friends: "Amis",
  following: "Abonnements",
};

export function MomentFeed() {
  const [scope, setScope] = useState<Scope>("for-you");
  const [media, setMedia] = useState<"all" | "posts" | "clips">("all");
  const [moments, setMoments] = useState<FeedMoment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentMoment, setCommentMoment] = useState<FeedMoment | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);
  const feedRef = useRef<HTMLDivElement>(null);

  // Live polling for new moments
  const { newMoments, hasNew, clearNew } = useMomentPolling({
    scope,
    media,
    enabled: !initialLoading,
  });

  const handleInjectNew = useCallback(() => {
    if (newMoments.length === 0) return;
    const existingIds = new Set(moments.map((m) => m.id));
    const trulyNew = newMoments.filter((m) => !existingIds.has(m.id));
    if (trulyNew.length > 0) {
      setMoments((prev) => [...trulyNew, ...prev]);
    }
    clearNew();
    // Smooth scroll to top
    feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [newMoments, moments, clearNew]);
  const [hiddenSet, setHiddenSet] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("outside_hidden_moments");
      return new Set<string>(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });

  // Clips swipe-up hint (show once)
  const [showClipHint, setShowClipHint] = useState<boolean>(false);
  const clipsHintSeenRef = useRef<boolean>(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      clipsHintSeenRef.current = localStorage.getItem("outside_clips_hint_seen") === "1";
    } catch {
      clipsHintSeenRef.current = true; // avoid showing if storage fails
    }
  }, []);

  const markClipsHintSeen = useCallback(() => {
    if (clipsHintSeenRef.current) return;
    clipsHintSeenRef.current = true;
    try { localStorage.setItem("outside_clips_hint_seen", "1"); } catch {}
  }, []);

  const fetchMoments = useCallback(
    async (cursor?: string) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      try {
        const url = new URL("/api/moments", window.location.origin);
        url.searchParams.set("scope", scope);
        url.searchParams.set("limit", "10");
        url.searchParams.set("media", media);
        if (cursor) url.searchParams.set("cursor", cursor);

        const res = await fetch(url.toString(), { signal: abortRef.current.signal });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Erreur de chargement");
        }

        const all: FeedMoment[] = data.moments || [];
        const filtered = all.filter((m) => !hiddenSet.has(m.id));
        setMoments((prev) => (cursor ? [...prev, ...filtered] : filtered));
        setNextCursor(data.nextCursor || null);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Impossible de charger les moments.");
          console.error(err);
        }
      } finally {
        setLoading(false);
        setInitialLoading(false);
        isFetchingRef.current = false;
      }
    },
    [scope, media, hiddenSet]
  );

  useEffect(() => {
    setMoments([]);
    setNextCursor(null);
    setInitialLoading(true);
    fetchMoments();
  }, [scope, media, fetchMoments]);

  // Show a brief swipe-up hint the first time user visits Clips
  useEffect(() => {
    if (media !== "clips") return;
    if (clipsHintSeenRef.current) return;
    const t = setTimeout(() => {
      setShowClipHint(true);
      const t2 = setTimeout(() => {
        setShowClipHint(false);
        markClipsHintSeen();
      }, 2200);
      return () => clearTimeout(t2);
    }, 200);
    return () => clearTimeout(t);
  }, [media, markClipsHintSeen]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && nextCursor && !loading) {
          fetchMoments(nextCursor);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nextCursor, loading, fetchMoments]);

  const handleLikeToggle = useCallback(
    (id: string, liked: boolean) => {
      setMoments((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, viewerState: { ...m.viewerState, likedByMe: liked }, _count: { ...m._count, likes: liked ? m._count.likes + 1 : Math.max(0, m._count.likes - 1) } }
            : m
        )
      );
    },
    []
  );

  const handleDelete = useCallback((id: string) => {
    setMoments((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handleHide = useCallback((id: string) => {
    setHiddenSet((prev) => new Set([...Array.from(prev), id]));
    setMoments((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-[var(--os-bg)]/80 backdrop-blur-md border-b border-[var(--os-card-border)]">
        <div className="flex overflow-x-auto scrollbar-hide px-2">
          {(Object.keys(SCOPE_LABELS) as Scope[]).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              aria-current={scope === s ? "page" : undefined}
              className={`relative flex-shrink-0 px-3 py-2.5 text-xs font-bold rounded-full transition-colors ${
                scope === s
                  ? "text-[var(--os-fg)] bg-[var(--os-card-border)]/60"
                  : "text-[var(--os-muted)] hover:text-[var(--os-fg)]"
              }`}
            >
              {SCOPE_LABELS[s]}
              {scope === s && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-outside-500 transition-all duration-300" />
              )}
            </button>
          ))}
          {/* Media filter */}
          <div className="ml-auto">
            <MomentTypeFilter value={media} onChange={setMedia} />
          </div>

      {/* Clips swipe hint bubble */}
      {showClipHint && media === "clips" && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
          <div className="px-3 py-1.5 rounded-full bg-black/70 text-white text-[11px] font-bold shadow-lg">
            Glissez vers le haut
          </div>
        </div>
      )}
        </div>
      </div>

      {/* Feed: strong snap only for Clips */}
      <div
        ref={feedRef}
        className={`flex-1 overflow-y-auto ${media === "clips" ? "snap-y snap-mandatory" : "snap-none"} scrollbar-hide`}
        onScroll={() => {
          if (showClipHint) {
            setShowClipHint(false);
            markClipsHintSeen();
          }
        }}
      >
        {/* New moments banner */}
        {hasNew && !initialLoading && (
          <div className="sticky top-0 z-40 flex justify-center pt-2 pb-1">
            <button
              onClick={handleInjectNew}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-xs font-bold text-white shadow-glow animate-fade-in hover:shadow-glow-lg transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Nouveaux moments disponibles
            </button>
          </div>
        )}
        {initialLoading ? (
          <div className="space-y-6 p-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl bg-[var(--os-card)] border border-[var(--os-card-border)] overflow-hidden animate-fade-in max-w-[560px] mx-auto">
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <div className="h-8 w-8 rounded-full bg-[var(--os-bg)] shimmer" />
                  <div className="space-y-1">
                    <div className="h-3.5 w-24 rounded bg-[var(--os-bg)] shimmer" />
                    <div className="h-2.5 w-14 rounded bg-[var(--os-bg)] shimmer" />
                  </div>
                </div>
                <div className="aspect-square w-full bg-[var(--os-bg)] shimmer" />
                <div className="px-3.5 py-3 flex items-center justify-between">
                  <div className="flex gap-5">
                    <div className="h-5 w-5 rounded bg-[var(--os-bg)] shimmer" />
                    <div className="h-5 w-5 rounded bg-[var(--os-bg)] shimmer" />
                    <div className="h-5 w-5 rounded bg-[var(--os-bg)] shimmer" />
                    <div className="h-5 w-5 rounded bg-[var(--os-bg)] shimmer" />
                  </div>
                  <div className="h-5 w-5 rounded bg-[var(--os-bg)] shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-sm text-[var(--os-muted)]">{error}</p>
            <button
              onClick={() => fetchMoments()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-outside-100 px-4 py-2 text-xs font-bold text-outside-700 hover:bg-outside-200 transition-colors"
            >
              Réessayer
            </button>
          </div>
        ) : moments.length === 0 ? (
          <div className="p-6">
            <OutsideEmptyState
              icon={Camera}
              title={
                media === "posts"
                  ? "Aucune publication pour le moment"
                  : media === "clips"
                  ? "Aucun clip pour le moment"
                  : "Aucun moment pour l'instant"
              }
              description={
                media === "clips"
                  ? "Montre l'ambiance dehors."
                  : "Montre ce qui se passe dehors."
              }
              action={(
                <Link
                  href="/moments/new"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
                >
                  Ajouter un moment
                </Link>
              )}
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--os-card-border)]">
            {moments.map((moment, index) => (
              <>
                <MomentCard
                  key={moment.id}
                  moment={moment}
                  onLikeToggle={handleLikeToggle}
                  onOpenComments={setCommentMoment}
                  onDelete={handleDelete}
                  onHide={handleHide}
                />
                {index === 1 && scope === "for-you" && media === "all" && (
                  <AccountDiscovery />
                )}
                {index === 3 && scope === "for-you" && media === "all" && (
                  <CityActiveDiscovery />
                )}
                {index === 5 && scope === "for-you" && media === "all" && (
                  <TopCreatorsDiscovery />
                )}
              </>
            ))}
            {/* Sentinel */}
            <div ref={sentinelRef} className="h-20 flex items-center justify-center">
              {loading && nextCursor && (
                <Loader2 className="h-5 w-5 animate-spin text-outside-500" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comments sheet */}
      <MomentCommentsSheet
        momentId={commentMoment?.id || ""}
        open={!!commentMoment}
        onClose={() => setCommentMoment(null)}
      />
    </div>
  );
}
