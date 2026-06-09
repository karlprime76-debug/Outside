"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import { useHaptic } from "@/hooks/use-haptic";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
}

export function BottomSheet({ open, onClose, title, children, footer, maxHeight = "85vh" }: BottomSheetProps) {
  const [show, setShow] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const haptic = useHaptic();

  useEffect(() => {
    if (open) {
      setShow(true);
      setDragY(0);
      requestAnimationFrame(() => setAnimating(true));
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = original;
        document.removeEventListener("keydown", handleEscape);
      };
    } else {
      setAnimating(false);
      const t = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(t);
    }
  }, [open, onClose]);

  const handleBackdrop = useCallback(() => {
    onClose();
  }, [onClose]);

  // Swipe-down-to-close on handle/header area
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    currentYRef.current = touch.clientY;
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    currentYRef.current = touch.clientY;
    const delta = Math.max(0, touch.clientY - startYRef.current);
    // Only allow dragging down, resist slightly
    setDragY(delta * 0.6);
  }, [isDragging]);

  const onTouchEnd = useCallback(() => {
    setIsDragging(false);
    const delta = currentYRef.current - startYRef.current;
    const velocity = delta / 200; // rough velocity check
    if (delta > 80 || velocity > 1.5) {
      haptic.medium();
      onClose();
    } else {
      setDragY(0);
    }
  }, [onClose, haptic]);

  if (!show) return null;

  const transform = animating
    ? `translateY(${dragY}px)`
    : `translateY(calc(100% + ${dragY}px))`;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          animating && dragY === 0 ? "opacity-100" : "opacity-0"
        )}
        onClick={handleBackdrop}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "relative w-full max-w-lg rounded-t-3xl bg-[var(--os-bg)] shadow-[0_-8px_32px_rgba(0,0,0,0.2)] flex flex-col",
          isDragging ? "transition-none" : "transition-transform duration-300 ease-out"
        )}
        style={{ maxHeight, paddingBottom: "env(safe-area-inset-bottom, 0px)", transform }}
        role="dialog"
        aria-modal="true"
      >
        {/* Handle — swipe target */}
        <div
          className="flex justify-center pt-3 pb-1 touch-none select-none cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="h-1.5 w-10 rounded-full bg-[var(--os-card-border)]" />
        </div>

        {/* Header */}
        {title && (
          <div
            className="flex items-center justify-between px-5 pb-3 touch-none select-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <h2 className="text-lg font-bold text-[var(--os-fg)]">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-[var(--os-muted)] hover:bg-[var(--os-card-border)] transition-colors active:scale-95"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-y-contain px-5 pb-4">
          {children}
        </div>

        {/* Sticky footer */}
        {footer && (
          <div className="shrink-0 border-t border-[var(--os-card-border)] px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
