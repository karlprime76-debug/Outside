"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useGlobalAudio } from "@/hooks/use-global-audio";
import { Volume2, VolumeX, Music } from "lucide-react";
import Link from "next/link";

interface MomentAudioPlayerProps {
  audioUrl: string;
  trackId: string;
  title: string;
  artistName: string | null;
  volume?: number;
  startTime?: number;
  linkToDetail?: boolean;
}

export function MomentAudioPlayer({
  audioUrl,
  trackId,
  title,
  artistName,
  volume = 1,
  startTime = 0,
  linkToDetail = true,
}: MomentAudioPlayerProps) {
  const { state, play, pause, toggleMute, stop } = useGlobalAudio();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const isPlaying = state.src === audioUrl && state.playing;
  const isMuted = state.src === audioUrl ? state.muted : false;

  // IntersectionObserver: play only when 70% visible
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.5);
      },
      { threshold: [0, 0.5, 0.7, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-play / pause based on visibility
  useEffect(() => {
    if (!visible) {
      if (state.src === audioUrl) pause();
      return;
    }
    // Only auto-play if user has interacted with page (autoplay policy)
    if (userInteracted) {
      play(audioUrl, trackId, title, artistName || "", { volume, startTime });
    }
  }, [visible, userInteracted, audioUrl, trackId, title, artistName, volume, startTime, play, pause, state.src]);

  // Stop on unmount
  useEffect(() => {
    return () => {
      if (state.src === audioUrl) stop();
    };
  }, [audioUrl, state.src, stop]);

  const handleToggle = useCallback(() => {
    if (!userInteracted) setUserInteracted(true);
    if (isPlaying) {
      pause();
    } else {
      play(audioUrl, trackId, title, artistName || "", { volume, startTime });
    }
  }, [isPlaying, audioUrl, trackId, title, artistName, volume, startTime, play, pause, userInteracted]);

  const handleMute = useCallback(() => {
    if (!userInteracted) setUserInteracted(true);
    toggleMute();
  }, [toggleMute, userInteracted]);

  return (
    <div ref={containerRef} className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full">
      <Music className="h-3 w-3 text-white/80 shrink-0" />
      {linkToDetail ? (
        <Link
          href={`/audio/${trackId}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-white/90 truncate font-medium hover:underline"
        >
          {title}
        </Link>
      ) : (
        <span className="text-xs text-white/90 truncate font-medium">{title}</span>
      )}
      {artistName && <span className="text-[10px] text-white/60 truncate">· {artistName}</span>}
      <button
        onClick={handleToggle}
        className="ml-1 rounded-full p-1 hover:bg-white/10 transition-colors"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg className="h-3 w-3 text-white fill-current" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
        ) : (
          <svg className="h-3 w-3 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        )}
      </button>
      <button
        onClick={handleMute}
        className="rounded-full p-1 hover:bg-white/10 transition-colors"
        aria-label={isMuted ? "Activer le son" : "Couper le son"}
      >
        {isMuted ? (
          <VolumeX className="h-3 w-3 text-white/70" />
        ) : (
          <Volume2 className="h-3 w-3 text-white/70" />
        )}
      </button>
    </div>
  );
}
