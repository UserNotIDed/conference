"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts a number up on reveal. Used for the two figures the demo is selling —
 * the elapsed seconds and the annual leak — because a number that lands is read
 * and a number that is simply present is skimmed. Honours reduced motion by
 * arriving instantly.
 */
export function useCountUp(target: number, durationMs = 900) {
  // Progress rather than the value itself, so the animation owns one number and
  // the caller's target can change without the two fighting. Starts at 0 and is
  // only ever advanced from inside a frame callback — never synchronously
  // during an effect, which would cascade a render on every mount.
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);
  const backstop = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      raf.current = requestAnimationFrame(() => setProgress(1));
    } else {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        // easeOutCubic — fast then settling, which reads as arriving rather than sliding
        setProgress(1 - Math.pow(1 - t, 3));
        if (t < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    }

    // requestAnimationFrame does not fire in a backgrounded tab, so a phone
    // that locks — or an attendee who switches apps — mid-animation would come
    // back to a headline reading $0,000 until the next frame. Timers do still
    // fire, throttled, so this guarantees the number is correct whether or not
    // the animation ever ran. If it did, setting 1 again is a no-op.
    backstop.current = setTimeout(() => setProgress(1), durationMs + 250);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      if (backstop.current) clearTimeout(backstop.current);
    };
  }, [target, durationMs]);

  return target * progress;
}
