"use client";

import { useState, useEffect, useCallback, useRef } from "react";

function getDraftKey(userId?: string) {
  return `outside_moment_draft_${userId || "anonymous"}`;
}

interface MomentDraft {
  caption: string;
  visibility: string;
  city: string;
  publishAsClip: boolean;
  audioTrackId?: string | null;
  audioVolume?: number;
  mediaType?: string | null;
  videoStartTime?: number;
  videoEndTime?: number;
  mediaCrop?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export function useMomentDraft(userId?: string) {
  const [draft, setDraft] = useState<MomentDraft | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [hasMedia, setHasMedia] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUserId = useRef(userId);

  // Load draft on mount or when userId changes
  useEffect(() => {
    if (prevUserId.current !== userId) {
      setDraft(null);
      setSavedAt(null);
      prevUserId.current = userId;
    }
    try {
      const raw = localStorage.getItem(getDraftKey(userId));
      if (raw) {
        const parsed = JSON.parse(raw) as MomentDraft;
        setDraft(parsed);
      }
    } catch {
      setDraft(null);
    }
  }, [userId]);

  // Clear pending auto-save on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  const saveDraft = useCallback(
    (data: Partial<MomentDraft>) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

      autoSaveTimer.current = setTimeout(() => {
        try {
          const existing = (() => {
            try {
              const raw = localStorage.getItem(getDraftKey(userId));
              return raw ? (JSON.parse(raw) as MomentDraft) : null;
            } catch {
              return null;
            }
          })();

          const next: MomentDraft = {
            caption: data.caption ?? existing?.caption ?? "",
            visibility: data.visibility ?? existing?.visibility ?? "PUBLIC",
            city: data.city ?? existing?.city ?? "",
            publishAsClip: data.publishAsClip ?? existing?.publishAsClip ?? false,
            audioTrackId: data.audioTrackId ?? existing?.audioTrackId ?? null,
            audioVolume: data.audioVolume ?? existing?.audioVolume ?? 1,
            mediaType: data.mediaType ?? existing?.mediaType ?? null,
            videoStartTime: data.videoStartTime ?? existing?.videoStartTime ?? undefined,
            videoEndTime: data.videoEndTime ?? existing?.videoEndTime ?? undefined,
            mediaCrop: data.mediaCrop ?? existing?.mediaCrop ?? null,
            createdAt: existing?.createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          localStorage.setItem(getDraftKey(userId), JSON.stringify(next));
          setDraft(next);
          setSavedAt(new Date());
        } catch {
          // localStorage might be full or unavailable
        }
      }, 600); // debounce 600ms
    },
    [userId]
  );

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(getDraftKey(userId));
    } catch {
      // ignore
    }
    setDraft(null);
    setSavedAt(null);
  }, [userId]);

  const restoreDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(getDraftKey(userId));
      if (raw) {
        const parsed = JSON.parse(raw) as MomentDraft;
        setDraft(parsed);
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  }, [userId]);

  const dismissSaved = useCallback(() => {
    setSavedAt(null);
  }, []);

  return {
    draft,
    savedAt,
    hasMedia,
    setHasMedia,
    saveDraft,
    clearDraft,
    restoreDraft,
    dismissSaved,
  };
}
