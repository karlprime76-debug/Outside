"use client";

/**
 * PWA detection helpers for OUTSIDE
 */

export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS legacy
    ("standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

export function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /android/.test(ua);
}

export function isPWAInstalledLike(): boolean {
  return isStandaloneMode();
}

export function canInstallPWA(): boolean {
  if (typeof window === "undefined") return false;
  // Before install prompt is only on Android/Chrome desktop
  // iOS always shows the add-to-homesheet button in Safari share sheet
  if (isStandaloneMode()) return false;
  if (isIOS()) return true; // can always add on iOS
  return "BeforeInstallPromptEvent" in window;
}
