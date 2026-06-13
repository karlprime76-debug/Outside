"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MomentCard } from "./moment-card";
import { MomentCommentsSheet } from "./moment-comments-sheet";
import { AccountDiscovery } from "./account-discovery";
import { CityActiveDiscovery } from "./city-active-discovery";
import { TopCreatorsDiscovery } from "./top-creators-discovery";
import { Loader2, Camera, Sparkles, MapPin, Users, UserPlus, Search, RefreshCw } from "lucide-react";
import Link from "next/link";
import { OutsideEmptyState } from "@/components/ui/outside-empty-state";
import { useMomentPolling } from "@/hooks/use-moment-polling";
import { useHaptic } from "@/hooks/use-haptic";
import { useDictionary } from "@/hooks/use-dictionary";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

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
    reactions: number;
    comments: number;
  };
  viewerState: {
    likedByMe: boolean;
    myReaction: string | null;
    savedByMe?: boolean;
    canDelete: boolean;
    canReport: boolean;
  };
  audioTrackId?: string | null;
  audioStartTime?: number | null;
  audioVolume?: number | null;
  audioTrack?: {
    id: string;
    title: string;
    artistName: string | null;
    audioUrl: string;
  } | null;
}

type Scope = "for-you" | "city" | "friends" | "following";

const SCOPE_LABELS: Record<Scope, string> = {
  "for-you": "Pour toi",
  city: "Ta ville",
  friends: "Amis",
  following: "Abonnements",
};

export function MomentFeed() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [scope, setScope] = useState<Scope>("for-you");
  const media = "all";
  const haptic = useHaptic();
  const t = useDictionary();

  const EMPTY_STATES: Record<Scope, { title: string; description: string; icon: typeof Camera; actions?: React.ReactNode }> = {
    "for-you": {
      title: "Découvre ce qui se passe",
      description: "Publie, suis des comptes et explore ce qui bouge dehors.",
      icon: Sparkles,
      actions: (
        <div className="flex flex-col gap-3">
          <Link
            href="/moments/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all active:scale-95"
          >
            <Camera className="h-4 w-4" />
            Ajouter un moment
          </Link>
          <Link
            href="/users/discover"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-[var(--os-card-border)] px-5 py-2.5 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 transition-all active:scale-95"
          >
            <Search className="h-4 w-4" />
            Découvrir des comptes
          </Link>
        </div>
      ),
    },
    city: {
      title: "Ta ville est calme",
      description: t.moment.noMoments,
      icon: MapPin,
      actions: (
        <div className="flex flex-col gap-3">
          <Link
            href="/moments/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all active:scale-95"
          >
            <Camera className="h-4 w-4" />
            Publier ici
          </Link>
          <Link
            href="/users/discover"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-[var(--os-card-border)] px-5 py-2.5 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 transition-all active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            Découvrir des comptes locaux
          </Link>
        </div>
      ),
    },
    friends: {
      title: "Ajoute des amis",
      description: "Ajoute des amis pour voir leurs Moments ici.",
      icon: Users,
      actions: (
        <div className="flex flex-col gap-3">
          <Link
            href="/friends"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-outside-100 px-5 py-2.5 text-sm font-bold text-outside-700 hover:bg-outside-200 transition-colors active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            Trouver des amis
          </Link>
          <Link
            href="/invite"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-[var(--os-card-border)] px-5 py-2.5 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 transition-all active:scale-95"
          >
            <Users className="h-4 w-4" />
            Inviter ton cercle
          </Link>
        </div>
      ),
    },
    following: {
      title: "Suis des comptes",
      description: "Suis des comptes pour remplir cet espace avec leurs Moments.",
      icon: Search,
      actions: (
        <Link
          href="/u"
          className="inline-flex items-center gap-1.5 rounded-full bg-outside-100 px-5 py-2.5 text-sm font-bold text-outside-700 hover:bg-outside-200 transition-colors active:scale-95"
        >
          <Search className="h-4 w-4" />
          Découvrir
        </Link>
      ),
    },
  };

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
      const raw = localStorage.getItem(`outside_hidden_moments_${userId || "anonymous"}`);
      return new Set<string>(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });
  const [hiddenAccounts, setHiddenAccounts] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(`outside_hidden_accounts_${userId || "anonymous"}`);
      return new Set<string>(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });

  // Re-sync hidden sets when userId settles (e.g. session loads after mount)
  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(`outside_hidden_moments_${userId}`);
      setHiddenSet(new Set<string>(raw ? JSON.parse(raw) : []));
    } catch { /* ignore */ }
    try {
      const raw = localStorage.getItem(`outside_hidden_accounts_${userId}`);
      setHiddenAccounts(new Set<string>(raw ? JSON.parse(raw) : []));
    } catch { /* ignore */ }
  }, [userId]);

  const fetchMoments = useCallback(
    async (cursor?: string, retries = 2) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      if (!cursor) setLoading(true);
      setError(null);

      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= retries; attempt++) {
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
          const filtered = all.filter(
            (m) => !hiddenSet.has(m.id) && !hiddenAccounts.has(m.author.id)
          );
          setMoments((prev) => (cursor ? [...prev, ...filtered] : filtered));
          setNextCursor(data.nextCursor || null);
          return;
        } catch (err) {
          lastError = err as Error;
          if ((err as Error).name === "AbortError") return;
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
          }
        }
      }

      if (lastError) {
        setError("Impossible de charger les moments.");
        console.error(lastError);
      }
    },
    [scope, hiddenSet, hiddenAccounts, media]
  );

  useEffect(() => {
    setMoments([]);
    setNextCursor(null);
    setInitialLoading(true);
    fetchMoments();
  }, [scope, fetchMoments]);

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
            ? { ...m, viewerState: { ...m.viewerState, likedByMe: liked }, _count: { ...m._count, reactions: liked ? m._count.reactions + 1 : Math.max(0, m._count.reactions - 1) } }
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

  const handleHideAccount = useCallback((authorId: string) => {
    setHiddenAccounts((prev) => new Set([...Array.from(prev), authorId]));
    setMoments((prev) => prev.filter((m) => m.author.id !== authorId));
  }, []);

  const handleRefresh = useCallback(async () => {
    haptic.medium();
    setMoments([]);
    setNextCursor(null);
    await fetchMoments();
  }, [fetchMoments, haptic]);

  const { containerRef: pullRefreshRef, isPulling, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
    enabled: true,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-[var(--os-bg)]/80 backdrop-blur-md border-b border-[var(--os-card-border)]">
        <div className="flex items-center justify-center gap-1 px-3 py-2 overflow-x-auto scrollbar-hide">
          {(Object.keys(SCOPE_LABELS) as Scope[]).map((s) => {
            const isActive = scope === s;
            return (
              <button
                key={s}
                onClick={() => { haptic.light(); setScope(s); }}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex-shrink-0 px-4 py-1.5 text-[13px] font-bold rounded-full transition-all active:scale-95 ${
                  isActive
                    ? "text-white bg-gradient-to-r from-outside-500 to-accent-500 shadow-glow"
                    : "text-[var(--os-muted)] hover:text-[var(--os-fg)] hover:bg-[var(--os-card-border)]/40"
                }`}
              >
                {SCOPE_LABELS[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      <div
        ref={(el) => {
          (feedRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          (pullRefreshRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        className="flex-1 overflow-y-auto scrollbar-hide relative"
      >
        {/* Pull to refresh indicator */}
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50"
          style={{
            transform: `translateY(${isPulling ? Math.min(pullDistance, 80) : -80}px)`,
            opacity: progress,
          }}
        >
          <RefreshCw
            className={`h-6 w-6 text-outside-500 ${isRefreshing ? "animate-spin" : ""}`}
            style={{ transform: `rotate(${progress * 360}deg)` }}
          />
        </div>
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
              icon={EMPTY_STATES[scope].icon}
              title={EMPTY_STATES[scope].title}
              description={EMPTY_STATES[scope].description}
              actions={EMPTY_STATES[scope].actions}
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--os-card-border)]">
            {moments.map((moment, index) => (
              <>
                <MomentCard
                  key={moment.id}
                  moment={moment}
                  userId={userId}
                  onLikeToggle={handleLikeToggle}
                  onOpenComments={setCommentMoment}
                  onDelete={handleDelete}
                  onHide={handleHide}
                  onHideAccount={handleHideAccount}
                />
                {index === 1 && scope === "for-you" && (
                  <AccountDiscovery />
                )}
                {index === 3 && scope === "for-you" && (
                  <CityActiveDiscovery />
                )}
                {index === 5 && scope === "for-you" && (
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
