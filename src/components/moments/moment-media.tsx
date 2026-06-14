"use client";

import React, { forwardRef, useMemo, useState, useRef, useEffect } from "react";
import Image from "next/image";

interface MomentMediaProps {
  type: string;
  src: string;
  className?: string;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  preload?: "none" | "metadata" | "auto";
  controls?: boolean;
  videoStartTime?: number;
  videoEndTime?: number;
  priority?: boolean;
  fetchPriority?: "auto" | "high" | "low";
}

function normalizeMediaUrl(url: string): string {
  if (!url) return url;
  // If someone stored a public asset as "/public/foo/bar.mp4", fix to "/foo/bar.mp4"
  if (url.startsWith("/public/")) return url.replace(/^\/public\//, "/");
  return url;
}

function isVideoByExtension(url: string): boolean {
  try {
    const u = url.split("?")[0].toLowerCase();
    return u.endsWith(".mp4") || u.endsWith(".webm") || u.endsWith(".mov") || u.endsWith(".m4v");
  } catch {
    return false;
  }
}

export const MomentMedia = forwardRef<HTMLVideoElement, MomentMediaProps>(function MomentMedia(
  { type, src, className, muted = true, loop = true, playsInline = true, preload = "metadata", controls = true, videoStartTime, videoEndTime, priority, fetchPriority },
  ref
) {
  const [error, setError] = useState<string | null>(null);
  const safeSrc = useMemo(() => normalizeMediaUrl(src), [src]);
  const isVideo = type === "VIDEO" || isVideoByExtension(safeSrc);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync refs
  useEffect(() => {
    if (typeof ref === "function") {
      ref(videoRef.current);
    } else if (ref) {
      ref.current = videoRef.current;
    }
  }, [ref]);

  // Handle video trim
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo || !videoStartTime) return;

    const handleTimeUpdate = () => {
      if (videoEndTime && video.currentTime >= videoEndTime) {
        if (loop) {
          video.currentTime = videoStartTime;
        } else {
          video.pause();
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (videoStartTime) {
        video.currentTime = videoStartTime;
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [isVideo, videoStartTime, videoEndTime, loop]);

  if (error) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-black/60 ${className || ""}`}>
        <p className="text-xs font-bold text-white/80">Vidéo indisponible</p>
      </div>
    );
  }

  if (isVideo) {
    return (
      <video
        ref={videoRef}
        src={safeSrc}
        className={className || "h-full w-full object-cover"}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        controls={controls}
        preload={preload}
        onError={() => setError("error")}
      />
    );
  }

  return (
    <div className="relative h-full w-full">
      <Image
        src={safeSrc}
        alt="Moment"
        fill
        className={className || "object-cover"}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        loading={priority ? undefined : "lazy"}
        priority={priority}
        fetchPriority={fetchPriority}
        onError={() => setError("error")}
      />
    </div>
  );
});
