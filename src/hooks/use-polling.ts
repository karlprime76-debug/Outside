"use client";

import { useEffect, useRef } from "react";

export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled = true
) {
  const savedCallback = useRef(callback);
  const isFetchingRef = useRef(false);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const id = setInterval(async () => {
      if (!isVisibleRef.current || isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        await savedCallback.current();
      } finally {
        isFetchingRef.current = false;
      }
    }, intervalMs);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [intervalMs, enabled]);
}
