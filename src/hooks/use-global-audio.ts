"use client";

import { useRef, useCallback, useSyncExternalStore } from "react";

interface AudioState {
  playing: boolean;
  muted: boolean;
  volume: number;
  src: string | null;
  trackId: string | null;
  title: string | null;
  artistName: string | null;
}

let currentAudio: HTMLAudioElement | null = null;
let listeners: (() => void)[] = [];

function notify() {
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

function getState(): AudioState {
  return {
    playing: currentAudio ? !currentAudio.paused : false,
    muted: currentAudio ? currentAudio.muted : false,
    volume: currentAudio ? currentAudio.volume : 1,
    src: currentAudio?.src ?? null,
    trackId: currentAudio?.dataset.trackId ?? null,
    title: currentAudio?.dataset.title ?? null,
    artistName: currentAudio?.dataset.artistName ?? null,
  };
}

export function useGlobalAudio() {
  const state = useSyncExternalStore(subscribe, getState, getState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const play = useCallback(
    (src: string, trackId: string, title: string, artistName: string, opts?: { volume?: number; startTime?: number }) => {
      // If same track is already playing, just resume or ensure it's playing
      if (currentAudio && currentAudio.src === src) {
        if (currentAudio.paused) {
          currentAudio.play().catch((err) => { console.error("[MOMENT_ERROR] Failed to play audio:", err); });
        }
        return;
      }
      // Stop existing
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
        currentAudio = null;
      }
      const a = new Audio(src);
      a.dataset.trackId = trackId;
      a.dataset.title = title;
      a.dataset.artistName = artistName;
      a.volume = opts?.volume ?? 1;
      a.muted = false;
      a.loop = true;
      a.preload = "metadata";
      if (opts?.startTime) a.currentTime = opts.startTime;

      const onPlay = () => notify();
      const onPause = () => notify();
      const onEnded = () => notify();
      const onVolume = () => notify();

      a.addEventListener("play", onPlay);
      a.addEventListener("pause", onPause);
      a.addEventListener("ended", onEnded);
      a.addEventListener("volumechange", onVolume);

      // Cleanup listener on stop
      a.addEventListener("pause", () => {
        a.removeEventListener("play", onPlay);
        a.removeEventListener("pause", onPause);
        a.removeEventListener("ended", onEnded);
        a.removeEventListener("volumechange", onVolume);
      }, { once: true });

      currentAudio = a;
      a.play().catch((err) => { console.error("[MOMENT_ERROR] Failed to play audio:", err); });
      notify();
    },
    []
  );

  const pause = useCallback(() => {
    currentAudio?.pause();
    notify();
  }, []);

  const stop = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = "";
      currentAudio = null;
      notify();
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (currentAudio) {
      currentAudio.muted = !currentAudio.muted;
      notify();
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    if (currentAudio) {
      currentAudio.volume = Math.min(1, Math.max(0, v));
      notify();
    }
  }, []);

  const isPlaying = useCallback(
    (src?: string) => {
      if (src) return stateRef.current.src === src && stateRef.current.playing;
      return stateRef.current.playing;
    },
    []
  );

  return { state, play, pause, stop, toggleMute, setVolume, isPlaying };
}
