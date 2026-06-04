"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface PollingMoment {
  id: string;
  type: string;
  mediaUrl: string;
  caption: string | null;
  city: string | null;
  countryCode: string | null;
  visibility: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    role: string;
    isVerified: boolean;
  };
  _count: { likes: number; comments: number };
  viewerState: {
    likedByMe: boolean;
    canDelete: boolean;
    canReport: boolean;
  };
}

interface UseMomentPollingOptions {
  scope: string;
  media: string;
  enabled?: boolean;
  intervalMs?: number;
}

export function useMomentPolling({
  scope,
  media,
  enabled = true,
  intervalMs = 20000,
}: UseMomentPollingOptions) {
  const [newMoments, setNewMoments] = useState<PollingMoment[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const lastCheckRef = useRef<string>(new Date().toISOString());
  const isVisibleRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);

  const clearNew = useCallback(() => {
    setNewMoments([]);
    setHasNew(false);
    lastCheckRef.current = new Date().toISOString();
  }, []);

  const poll = useCallback(async () => {
    if (!isVisibleRef.current || isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const url = new URL("/api/moments", window.location.origin);
      url.searchParams.set("scope", scope);
      url.searchParams.set("media", media);
      url.searchParams.set("since", lastCheckRef.current);
      url.searchParams.set("limit", "20");

      const res = await fetch(url.toString(), { signal: abortRef.current.signal });
      const data = await res.json();
      if (!res.ok) return;

      const fetched: PollingMoment[] = data.moments || [];
      if (fetched.length > 0) {
        setNewMoments((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const trulyNew = fetched.filter((m) => !existingIds.has(m.id));
          if (trulyNew.length > 0) {
            setHasNew(true);
            return [...trulyNew, ...prev];
          }
          return prev;
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Moment polling error:", err);
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [scope, media]);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const id = setInterval(poll, intervalMs);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibility);
      abortRef.current?.abort();
    };
  }, [enabled, intervalMs, poll]);

  return { newMoments, hasNew, clearNew };
}
