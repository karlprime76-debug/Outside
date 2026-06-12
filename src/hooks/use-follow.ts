"use client";

import { useState, useCallback } from "react";

interface UseFollowOptions {
  userId: string;
  initialFollowing?: boolean;
  onSuccess?: (following: boolean) => void;
  onError?: (error: string) => void;
}

export function useFollow({ userId, initialFollowing = false, onSuccess, onError }: UseFollowOptions) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const newState = !following;
    setFollowing(newState);
    try {
      let res: Response;
      if (newState) {
        res = await fetch("/api/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
      } else {
        res = await fetch(`/api/follow?userId=${userId}`, { method: "DELETE" });
      }
      if (!res.ok) {
        setFollowing(!newState);
        const data = await res.json().catch(() => ({ error: "Erreur réseau" }));
        onError?.(data.error || "Erreur");
        return;
      }
      onSuccess?.(newState);
    } catch {
      setFollowing(!newState);
      onError?.("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [userId, following, loading, onSuccess, onError]);

  return { following, loading, toggle };
}