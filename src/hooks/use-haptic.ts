"use client";

export function useHaptic() {
  function vibrate(pattern: number | number[] = 8) {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore unsupported vibrate patterns
      }
    }
  }

  return {
    /** Very light tap — navigation, toggles */
    light: () => vibrate(8),
    /** Medium feedback — buttons, actions */
    medium: () => vibrate(15),
    /** Strong feedback — success, important actions */
    strong: () => vibrate([15, 30, 15]),
    /** Error / warning buzz */
    error: () => vibrate([20, 40, 20, 40, 20]),
    /** Success — two light taps */
    success: () => vibrate([10, 20, 10]),
    vibrate,
  };
}
