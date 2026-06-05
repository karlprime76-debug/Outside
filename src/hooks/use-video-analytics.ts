"use client";

import { useCallback, useEffect, useRef } from "react";

const THRESHOLDS = [25, 50, 75, 90];
const COMPLETE_VIEW_THRESHOLD = 80;
const QUICK_SKIP_MS = 3000;

interface VideoAnalyticsOptions {
  momentId: string;
  enabled?: boolean;
  onEvent?: (type: string, data?: Record<string, unknown>) => void;
}

export function useVideoAnalytics({ momentId, enabled = true, onEvent }: VideoAnalyticsOptions) {
  const sentThresholdsRef = useRef<Set<number>>(new Set());
  const startTimeRef = useRef<number | null>(null);
  const lastSeekRef = useRef<number>(0);
  const playCountRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const trackEvent = useCallback(
    (type: string, data?: Record<string, unknown>) => {
      if (!enabled) return;
      fetch(`/api/moments/${momentId}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...data }),
      }).catch(() => {});
      onEvent?.(type, data);
    },
    [momentId, enabled, onEvent]
  );

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const currentTime = video.currentTime;
    const duration = video.duration;
    const percent = (currentTime / duration) * 100;

    // Check thresholds
    for (const threshold of THRESHOLDS) {
      if (percent >= threshold && !sentThresholdsRef.current.has(threshold)) {
        sentThresholdsRef.current.add(threshold);
        trackEvent("VIEW", {
          percent,
          watchMs: Math.round(currentTime * 1000),
        });
      }
    }

    // Check complete view
    if (percent >= COMPLETE_VIEW_THRESHOLD && !sentThresholdsRef.current.has(100)) {
      sentThresholdsRef.current.add(100);
      trackEvent("COMPLETE_VIEW", {
        percent,
        watchMs: Math.round(currentTime * 1000),
      });
    }
  }, [trackEvent]);

  const handlePlay = useCallback(() => {
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
    playCountRef.current += 1;

    // Track replay
    if (playCountRef.current > 1) {
      trackEvent("REPLAY");
    }
  }, [trackEvent]);

  const handlePause = useCallback(() => {
    const video = videoRef.current;
    if (!video || !startTimeRef.current) return;

    const watchMs = Date.now() - startTimeRef.current;
    const percent = (video.currentTime / video.duration) * 100;

    // Track quick skip (quit within 3 seconds)
    if (watchMs < QUICK_SKIP_MS && percent < 10) {
      trackEvent("VIEW", {
        watchMs,
        percent,
        source: "quick_skip",
      });
    }
  }, [trackEvent]);

  const handleSeeking = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    lastSeekRef.current = video.currentTime;
  }, []);

  const handleSeeked = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const seekDistance = Math.abs(video.currentTime - lastSeekRef.current);
    const duration = video.duration;

    // If seeking forward significantly, might be skipping
    if (seekDistance > duration * 0.1) {
      // Could track skip behavior
    }
  }, []);

  const handleEnded = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const percent = (video.currentTime / video.duration) * 100;
    const watchMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;

    // Ensure complete view is sent
    if (!sentThresholdsRef.current.has(100)) {
      sentThresholdsRef.current.add(100);
      trackEvent("COMPLETE_VIEW", {
        percent,
        watchMs: Math.round(watchMs),
      });
    }
  }, [trackEvent]);

  const attachVideo = useCallback((video: HTMLVideoElement | null) => {
    // Detach from previous video
    if (videoRef.current) {
      videoRef.current.removeEventListener("timeupdate", handleTimeUpdate);
      videoRef.current.removeEventListener("play", handlePlay);
      videoRef.current.removeEventListener("pause", handlePause);
      videoRef.current.removeEventListener("seeking", handleSeeking);
      videoRef.current.removeEventListener("seeked", handleSeeked);
      videoRef.current.removeEventListener("ended", handleEnded);
    }

    videoRef.current = video;

    if (video) {
      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("play", handlePlay);
      video.addEventListener("pause", handlePause);
      video.addEventListener("seeking", handleSeeking);
      video.addEventListener("seeked", handleSeeked);
      video.addEventListener("ended", handleEnded);
    }
  }, [handleTimeUpdate, handlePlay, handlePause, handleSeeking, handleSeeked, handleEnded]);

  // Send final watch time on unmount
  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (!video || !startTimeRef.current) return;

      const watchMs = Date.now() - startTimeRef.current;
      const percent = (video.currentTime / video.duration) * 100;

      trackEvent("VIEW", {
        watchMs: Math.round(watchMs),
        percent,
      });
    };
  }, [trackEvent]);

  return {
    attachVideo,
    trackEvent,
    reset: () => {
      sentThresholdsRef.current.clear();
      startTimeRef.current = null;
      playCountRef.current = 0;
    },
  };
}
