"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MomentCard } from "./moment-card";
import { MomentCommentsSheet } from "./moment-comments-sheet";
import { Loader2, Camera } from "lucide-react";
import Link from "next/link";
import { OutsideEmptyState } from "@/components/ui/outside-empty-state";

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
  const [moments, setMoments] = useState<FeedMoment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentMoment, setCommentMoment] = useState<FeedMoment | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);

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
        if (cursor) url.searchParams.set("cursor", cursor);

        const res = await fetch(url.toString(), { signal: abortRef.current.signal });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Erreur de chargement");
        }

        const newMoments: FeedMoment[] = data.moments || [];
        setMoments((prev) => (cursor ? [...prev, ...newMoments] : newMoments));
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
    [scope]
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

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-[var(--os-bg)]/80 backdrop-blur-md border-b border-[var(--os-card-border)]">
        <div className="flex overflow-x-auto scrollbar-hide px-2">
          {(Object.keys(SCOPE_LABELS) as Scope[]).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`relative flex-shrink-0 px-3 py-3 text-xs font-bold transition-colors ${
                scope === s ? "text-[var(--os-fg)]" : "text-[var(--os-muted)] hover:text-[var(--os-fg)]"
              }`}
            >
              {SCOPE_LABELS[s]}
              {scope === s && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-outside-500 transition-all duration-300" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-hide">
        {initialLoading ? (
          <div className="space-y-6 p-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl bg-[var(--os-card)] border border-[var(--os-card-border)] overflow-hidden animate-fade-in">
                <div className="h-[calc(100dvh-180px)] sm:h-[70vh] md:h-[600px] shimmer" />
                <div className="p-3 flex gap-4">
                  <div className="h-5 w-5 rounded bg-[var(--os-bg)] shimmer" />
                  <div className="h-5 w-5 rounded bg-[var(--os-bg)] shimmer" />
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
              title="Aucun moment pour l'instant"
              description="Montre ce qui se passe dehors."
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
            {moments.map((moment) => (
              <MomentCard
                key={moment.id}
                moment={moment}
                onLikeToggle={handleLikeToggle}
                onOpenComments={setCommentMoment}
                onDelete={handleDelete}
              />
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
