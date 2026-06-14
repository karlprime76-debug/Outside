"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Sparkles, Megaphone, RefreshCw } from "lucide-react";
import { usePolling } from "@/hooks/use-polling";
import { PlanCard } from "@/components/plan-card";
import { Avatar } from "@/components/ui/avatar";
import type { Plan } from "@/types/plan";

interface FeedMoment {
  id: string;
  __type: "moment";
  type: "PHOTO" | "VIDEO";
  mediaUrl: string;
  caption: string | null;
  city: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    isVerified: boolean;
    accountKind: string | null;
  };
  isSponsored: boolean;
  _count: { reactions: number; comments: number };
  viewerState: { likedByMe: boolean; savedByMe: boolean; canDelete: boolean; canReport: boolean };
}

interface FeedPlan {
  id: string;
  __type: "plan";
  title: string;
  mood: string;
  budgetLevel: string;
  priceType: string;
  startDate: string;
  city: string;
  place: string | null;
  creator: { name: string | null; username: string | null; image: string | null; isVerified: boolean };
  participantCount: number;
  isSponsored: boolean;
}

type FeedItem = FeedMoment | FeedPlan;

function MomentCard({ item }: { item: FeedMoment }) {
  return (
    <Link href={`/moments/${item.id}`} className="block os-card overflow-hidden group">
      <div className="relative aspect-square bg-black">
        {item.type === "VIDEO" ? (
          <video src={item.mediaUrl} className="h-full w-full object-cover" muted loop playsInline />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.mediaUrl} alt={item.caption || ""} className="h-full w-full object-cover" loading="lazy" />
        )}
        {item.isSponsored && (
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold text-white">
            <Megaphone className="h-3 w-3" /> Sponsorisé
          </span>
        )}
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Avatar src={item.author.image} name={item.author.name} size="sm" />
          <span className="text-sm font-bold text-[var(--os-fg)] truncate">{item.author.name || "Anonyme"}</span>
          {item.author.isVerified && (
            <span className="shrink-0 rounded-full bg-outside-500 p-0.5">
              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </span>
          )}
        </div>
        {item.caption && (
          <p className="text-sm text-[var(--os-muted)] line-clamp-2">{item.caption}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-[var(--os-muted)]">
          <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{item._count.reactions}</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{item._count.comments}</span>
        </div>
      </div>
    </Link>
  );
}

function PlanCardFeed({ item }: { item: FeedPlan }) {
  const plan: Plan = {
    id: item.id,
    title: item.title,
    mood: item.mood,
    planCategory: "AUTRE",
    priceType: item.priceType,
    budgetLevel: item.budgetLevel,
    budgetAmount: null,
    budgetCurrency: null,
    budgetIsFrom: false,
    startDate: item.startDate,
    maxParticipants: 0,
    status: "ACTIVE",
    city: { name: item.city },
    place: item.place ? { name: item.place } : null,
    creator: { name: item.creator.name, image: item.creator.image, username: item.creator.username },
    _count: { participants: item.participantCount },
  };

  return (
    <div className="relative">
      {item.isSponsored && (
        <span className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold text-white">
          <Megaphone className="h-3 w-3" /> Sponsorisé
        </span>
      )}
      <PlanCard plan={plan} showJoin />
    </div>
  );
}

export function HomeFeed({ activeCityName }: { activeCityName?: string }) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingNew, setPendingNew] = useState<FeedItem[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const sinceRef = useRef<string>(new Date().toISOString());

  const fetchFeed = useCallback(async (cursorVal?: string) => {
    const params = new URLSearchParams({ limit: "10" });
    if (cursorVal) params.set("cursor", cursorVal);
    if (activeCityName) params.set("city", activeCityName);

    const res = await fetch(`/api/feed?${params}`);
    if (!res.ok) return;

    const data = await res.json();
    if (cursorVal) {
      setFeed((prev) => [...prev, ...(data.feed || [])]);
    } else {
      setFeed(data.feed || []);
    }
    setCursor(data.nextCursor);
  }, [activeCityName]);

  const checkNew = useCallback(async () => {
    const params = new URLSearchParams({ limit: "5", since: sinceRef.current });
    if (activeCityName) params.set("city", activeCityName);
    try {
      const res = await fetch(`/api/feed?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      const items: FeedItem[] = data.feed || [];
      if (items.length === 0) return;
      const existingIds = new Set(feed.map((f) => `${f.__type}-${f.id}`));
      const trulyNew = items.filter((f) => !existingIds.has(`${f.__type}-${f.id}`));
      if (trulyNew.length > 0) {
        setPendingNew(trulyNew);
        setHasNew(true);
      }
    } catch {
      // silent
    }
  }, [activeCityName, feed]);

  useEffect(() => {
    fetchFeed().finally(() => setLoading(false));
  }, [fetchFeed]);

  usePolling(checkNew, 30000, !loading);

  function loadNewItems() {
    setFeed((prev) => {
      const existingIds = new Set(prev.map((f) => `${f.__type}-${f.id}`));
      const trulyNew = pendingNew.filter((f) => !existingIds.has(`${f.__type}-${f.id}`));
      return [...trulyNew, ...prev];
    });
    setPendingNew([]);
    setHasNew(false);
    sinceRef.current = new Date().toISOString();
  }

  useEffect(() => {
    if (!sentinelRef.current || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && cursor && !loadingMore) {
          setLoadingMore(true);
          fetchFeed(cursor).finally(() => setLoadingMore(false));
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [cursor, loading, loadingMore, fetchFeed]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="os-card p-0 overflow-hidden">
            <div className="aspect-square shimmer" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 shimmer rounded" />
              <div className="h-3 w-1/2 shimmer rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div className="os-card p-8 text-center">
        <Sparkles className="h-8 w-8 text-[var(--os-muted)] mx-auto mb-3" />
        <p className="text-sm font-bold text-[var(--os-fg)]">Bienvenue sur OUTSIDE</p>
        <p className="text-xs text-[var(--os-muted)] mt-1">Les publications apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-4">
      {hasNew && (
        <button
          onClick={loadNewItems}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-outside-200 bg-outside-50/50 dark:border-outside-800 dark:bg-outside-950/10 py-3 text-sm font-bold text-outside-600 hover:bg-outside-100/50 dark:hover:bg-outside-950/20 transition-all active:scale-[0.98] animate-slide-up"
        >
          <RefreshCw className="h-4 w-4" />
          Nouveaux moments disponibles
        </button>
      )}
      {feed.map((item) => (
        <div key={`${item.__type}-${item.id}`} className="animate-slide-up">
          {item.__type === "moment" ? (
            <MomentCard item={item as FeedMoment} />
          ) : (
            <PlanCardFeed item={item as FeedPlan} />
          )}
        </div>
      ))}

      {loadingMore && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="os-card p-0 overflow-hidden">
              <div className="aspect-square shimmer" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 shimmer rounded" />
                <div className="h-3 w-1/2 shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
    </div>
  );
}
