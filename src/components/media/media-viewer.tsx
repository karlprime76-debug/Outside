"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from "lucide-react";

interface MediaViewerProps {
  src: string;
  type: "image" | "video";
  alt?: string;
  onClose: () => void;
  downloadUrl?: string;
}

export function MediaViewer({ src, type, alt, onClose, downloadUrl }: MediaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const pinchRef = useRef({ startDist: 0, startScale: 1 });
  const panRef = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0 });
  const lastTapRef = useRef(0);
  const touchCountRef = useRef(0);

  const MIN_SCALE = 1;
  const MAX_SCALE = 4;

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const clampTranslate = useCallback(
    (tx: number, ty: number, s: number) => {
      if (s <= 1) return { x: 0, y: 0 };
      const el = mediaRef.current;
      const container = containerRef.current;
      if (!el || !container) return { x: tx, y: ty };
      const rect = el.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      const maxX = Math.max(0, (rect.width * s - cRect.width) / 2);
      const maxY = Math.max(0, (rect.height * s - cRect.height) / 2);
      return { x: Math.min(maxX, Math.max(-maxX, tx)), y: Math.min(maxY, Math.max(-maxY, ty)) };
    },
    []
  );

  const applyTransform = useCallback(
    (s: number, tx: number, ty: number) => {
      const clamped = clampScale(s);
      const clampedT = clampTranslate(tx, ty, clamped);
      setScale(clamped);
      setTranslate(clampedT);
    },
    [clampTranslate]
  );

  // Keyboard: Escape closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const getDistance = (t1: { clientX: number; clientY: number }, t2: { clientX: number; clientY: number }) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchCountRef.current = e.touches.length;
    if (e.touches.length === 2) {
      const dist = getDistance(e.touches[0], e.touches[1]);
      pinchRef.current = { startDist: dist, startScale: scale };
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      panRef.current = { startX: t.clientX, startY: t.clientY, lastX: translate.x, lastY: translate.y };
      setIsDragging(true);

      // Double tap detection
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        e.preventDefault();
        if (scale > 1.1) {
          applyTransform(1, 0, 0);
        } else {
          applyTransform(2.5, 0, 0);
        }
      }
      lastTapRef.current = now;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getDistance(e.touches[0], e.touches[1]);
      const ratio = dist / (pinchRef.current.startDist || 1);
      applyTransform(pinchRef.current.startScale * ratio, translate.x, translate.y);
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - panRef.current.startX;
      const dy = t.clientY - panRef.current.startY;
      applyTransform(scale, panRef.current.lastX + dx, panRef.current.lastY + dy);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchCountRef.current = 0;
    // Snap back if underzoomed
    if (scale < 1) {
      applyTransform(1, 0, 0);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    applyTransform(scale * delta, translate.x, translate.y);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      panRef.current = { startX: e.clientX, startY: e.clientY, lastX: translate.x, lastY: translate.y };
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      applyTransform(scale, panRef.current.lastX + dx, panRef.current.lastY + dy);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (scale > 1.1) {
      applyTransform(1, 0, 0);
    } else {
      applyTransform(2.5, 0, 0);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[101] rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition-colors"
        aria-label="Fermer"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Zoom controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[101] flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 backdrop-blur-md">
        <button
          onClick={() => applyTransform(scale * 0.8, translate.x, translate.y)}
          disabled={scale <= MIN_SCALE}
          className="text-white/80 hover:text-white disabled:opacity-30 transition-colors"
          aria-label="Zoom arrière"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <span className="text-xs font-mono text-white/80 min-w-[3ch] text-center">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => applyTransform(scale * 1.25, translate.x, translate.y)}
          disabled={scale >= MAX_SCALE}
          className="text-white/80 hover:text-white disabled:opacity-30 transition-colors"
          aria-label="Zoom avant"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <button
          onClick={() => applyTransform(1, 0, 0)}
          className="text-white/80 hover:text-white transition-colors"
          aria-label="Réinitialiser"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Télécharger"
          >
            <Download className="h-5 w-5" />
          </a>
        )}
      </div>

      {/* Media */}
      <div
        className="flex items-center justify-center w-full h-full p-4"
        style={{
          cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
        }}
      >
        {type === "image" ? (
          <img
            ref={mediaRef as React.RefObject<HTMLImageElement>}
            src={src}
            alt={alt || "Media"}
            draggable={false}
            className="max-w-full max-h-full object-contain transition-transform will-change-transform"
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            }}
          />
        ) : (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={src}
            controls
            playsInline
            className="max-w-full max-h-full object-contain transition-transform will-change-transform"
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            }}
          />
        )}
      </div>
    </div>
  );
}
