"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { StreakData } from "@/lib/streak";

const EMPTY: StreakData = { currentStreak: 0, longestStreak: 0, lastActiveDate: null, isToday: false };

export function useStreak() {
  const { data: session } = useSession();
  const [streak, setStreak] = useState<StreakData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/user/streak");
      if (res.ok) {
        const data = await res.json();
        setStreak(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    // Update streak on mount (daily visit)
    fetch("/api/user/streak", { method: "POST" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setStreak(data);
      })
      .catch((err) => { console.error("[SETTINGS_ERROR] Failed to update streak:", err); })
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  return { streak, loading, refresh };
}
