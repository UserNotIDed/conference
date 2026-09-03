"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VERIFY_RESULT } from "@/lib/demo";

export type VerifyState = {
  status: "idle" | "pending" | "complete";
  elapsedMs: number;
  durationMs: number;
  degraded: boolean;
  result: typeof VERIFY_RESULT | null;
};

/**
 * Drives the faked eligibility check.
 *
 * The server owns the real clock, but the client keeps its own copy of the
 * start time and duration so a dropped poll never leaves the attendee staring
 * at a spinner. If the kickoff POST itself fails, we fall back to a local
 * 7.5-second timer and carry on — the result is a fixed Aetna response either
 * way, and a demo that stalls on conference wifi is worse than one that
 * resolves without the round trip. The server reconciles on the next patch.
 */
export type VerifySnapshot = {
  status: "idle" | "pending" | "complete";
  remainingMs: number;
  durationMs: number;
};

export function useVerify(
  token: string,
  initial?: VerifySnapshot,
  offline = false,
) {
  // A reload lands here with the server's view already in hand. Without
  // seeding from it, someone who refreshes on the done screen watches a
  // finished eligibility check go back to "checking" and stay there — the
  // hook would be waiting on a POST that already happened.
  const [state, setState] = useState<VerifyState>(() => {
    if (initial?.status === "complete") {
      return {
        status: "complete",
        elapsedMs: initial.durationMs,
        durationMs: initial.durationMs,
        degraded: false,
        result: VERIFY_RESULT,
      };
    }
    if (initial?.status === "pending") {
      return {
        status: "pending",
        elapsedMs: initial.durationMs - initial.remainingMs,
        durationMs: initial.durationMs,
        degraded: false,
        result: null,
      };
    }
    return {
      status: "idle",
      elapsedMs: 0,
      durationMs: 0,
      degraded: false,
      result: null,
    };
  });

  // Anchored on mount rather than during render: reading the clock in a render
  // body is impure, and the anchor only has to exist before the first tick.
  const startedRef = useRef<number | null>(null);
  const durationRef = useRef(initial?.durationMs || 7500);
  const settledRef = useRef(initial?.status === "complete");

  useEffect(() => {
    if (startedRef.current !== null || !initial || initial.status === "idle")
      return;
    startedRef.current =
      Date.now() - (initial.durationMs - initial.remainingMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(async () => {
    if (startedRef.current !== null) return;
    startedRef.current = Date.now();
    setState((s) => ({
      ...s,
      status: "pending",
      durationMs: durationRef.current,
    }));
    // Preview runs the same 6–9 second beat with no session to check against.
    if (offline) {
      durationRef.current = 6000 + Math.floor(Math.random() * 3000);
      setState((s) => ({ ...s, durationMs: durationRef.current }));
      return;
    }
    try {
      const res = await fetch(`/api/session/${token}/verify`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (typeof data.durationMs === "number" && data.durationMs > 0) {
        durationRef.current = data.durationMs;
        // Re-anchor to the server's start so the two clocks agree.
        startedRef.current = Date.now() - (data.durationMs - data.remainingMs);
        setState((s) => ({ ...s, durationMs: data.durationMs }));
      }
    } catch {
      setState((s) => ({ ...s, degraded: true }));
    }
  }, [token, offline]);

  useEffect(() => {
    if (state.status !== "pending") return;
    let cancelled = false;

    // Tick locally at 100ms so the counter is smooth without polling at 100ms.
    const tick = setInterval(() => {
      if (cancelled || startedRef.current === null) return;
      const elapsedMs = Date.now() - startedRef.current;
      if (elapsedMs >= durationRef.current && !settledRef.current) {
        settledRef.current = true;
        setState((s) => ({
          ...s,
          status: "complete",
          elapsedMs,
          result: VERIFY_RESULT,
        }));
      } else {
        setState((s) => (s.status === "pending" ? { ...s, elapsedMs } : s));
      }
    }, 100);

    // Poll the server as the source of truth, but never depend on it.
    const poll = offline
      ? null
      : setInterval(async () => {
          try {
            const res = await fetch(`/api/session/${token}/verify`, {
              cache: "no-store",
            });
            if (!res.ok) return;
            const data = await res.json();
            if (cancelled) return;
            if (data.status === "complete" && !settledRef.current) {
              settledRef.current = true;
              setState((s) => ({
                ...s,
                status: "complete",
                result: data.result ?? VERIFY_RESULT,
              }));
            }
            setState((s) => (s.degraded ? { ...s, degraded: false } : s));
          } catch {
            setState((s) => ({ ...s, degraded: true }));
          }
        }, 1200);

    return () => {
      cancelled = true;
      clearInterval(tick);
      if (poll) clearInterval(poll);
    };
  }, [state.status, token, offline]);

  return { verify: state, startVerify: start };
}
