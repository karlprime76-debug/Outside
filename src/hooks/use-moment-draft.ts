"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const DRAFT_KEY = "outside_moment_draft";

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

export function useMomentDraft() {
  const [draft, setDraft] = useState<MomentDraft | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [hasMedia, setHasMedia] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MomentDraft;
        setDraft(parsed);
      }
    } catch {
      setDraft(null);
    }
  }, []);

  const saveDraft = useCallback(
    (data: Partial<MomentDraft>) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

      autoSaveTimer.current = setTimeout(() => {
        try {
          const existing = (() => {
            try {
              const raw = localStorage.getItem(DRAFT_KEY);
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

          localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
          setDraft(next);
          setSavedAt(new Date());
        } catch {
          // localStorage might be full or unavailable
        }
      }, 600); // debounce 600ms
    },
    []
  );

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    setDraft(null);
    setSavedAt(null);
  }, []);

  const restoreDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MomentDraft;
        setDraft(parsed);
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

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
