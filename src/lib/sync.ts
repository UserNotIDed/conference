"use client";

/**
 * Offline-safe write queue.
 *
 * Conference wifi drops requests, stalls for ten seconds, and comes back. The
 * attendee flow must not notice. So no screen ever awaits a write: every step
 * hands its payload to this queue and advances immediately, and the queue keeps
 * trying in the background until the server has it.
 *
 * Three properties make that safe:
 *  - Keyed. One pending patch per key, last write wins, so a retry storm cannot
 *    reorder "consent signed" behind an earlier edit of the same screen.
 *  - Durable. The queue is mirrored to localStorage, so a reload or a browser
 *    tab eviction mid-flow does not lose the steps already taken.
 *  - Idempotent on the server. Patches are applied by key, never appended, so
 *    delivering the same patch twice is indistinguishable from delivering once.
 */

export type PatchKey =
  | "opened"
  | "role"
  | "started"
  | "otp"
  | "identity"
  | "card"
  | "payment"
  | "identification"
  | "insurance"
  | "health"
  | "questionnaire"
  | "consent"
  | "finished"
  | "calc"
  | "stack"
  | "competitor"
  | "capture"
  | "benchmark"
  | "booked";

type Patch = { key: PatchKey; body: unknown; queuedAt: number };

const STORAGE_PREFIX = "yosi-booth:q:";
const MAX_BACKOFF = 8000;

type Listener = (state: { pending: number; failing: boolean }) => void;

export class SyncQueue {
  private token: string;
  private patches = new Map<PatchKey, Patch>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private backoff = 0;
  private inflight = false;
  private failing = false;
  private listeners = new Set<Listener>();

  constructor(token: string) {
    this.token = token;
    this.restore();
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.schedule(0));
      // A backgrounded tab gets its timers throttled; flush on the way out so a
      // pocketed phone still delivers the last step.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") this.flushBeacon();
        else this.schedule(0);
      });
    }
    this.schedule(0);
  }

  private get storageKey() {
    return STORAGE_PREFIX + this.token;
  }

  private restore() {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return;
      for (const p of JSON.parse(raw) as Patch[]) this.patches.set(p.key, p);
    } catch {
      /* a corrupt queue is not worth taking the demo down for */
    }
  }

  private persist() {
    if (typeof window === "undefined") return;
    try {
      const all = [...this.patches.values()];
      if (all.length === 0) window.localStorage.removeItem(this.storageKey);
      else window.localStorage.setItem(this.storageKey, JSON.stringify(all));
    } catch {
      /* Safari private mode throws on setItem; the in-memory queue still works */
    }
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn(this.state);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private get state() {
    return { pending: this.patches.size, failing: this.failing };
  }

  private emit() {
    for (const fn of this.listeners) fn(this.state);
  }

  push(key: PatchKey, body: unknown) {
    this.patches.set(key, { key, body, queuedAt: Date.now() });
    this.persist();
    this.emit();
    this.schedule(0);
  }

  private schedule(delay: number) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), delay);
  }

  private async flush() {
    if (this.inflight || this.patches.size === 0) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      this.failing = true;
      this.emit();
      this.schedule(2000);
      return;
    }

    const batch = [...this.patches.values()];
    this.inflight = true;
    try {
      const res = await fetch(`/api/session/${this.token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patches: batch.map((p) => ({ key: p.key, body: p.body })),
        }),
        keepalive: true,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Only drop what we actually sent. Anything queued mid-flight survives.
      for (const p of batch) {
        if (this.patches.get(p.key)?.queuedAt === p.queuedAt)
          this.patches.delete(p.key);
      }
      this.persist();
      this.backoff = 0;
      this.failing = false;
      this.emit();
      if (this.patches.size > 0) this.schedule(0);
    } catch {
      this.failing = true;
      this.emit();
      this.backoff = Math.min(
        MAX_BACKOFF,
        this.backoff ? this.backoff * 2 : 500,
      );
      this.schedule(this.backoff);
    } finally {
      this.inflight = false;
    }
  }

  /** Last-gasp delivery when the page is being hidden or closed. */
  private flushBeacon() {
    if (this.patches.size === 0 || typeof navigator === "undefined") return;
    try {
      const payload = JSON.stringify({
        patches: [...this.patches.values()].map((p) => ({
          key: p.key,
          body: p.body,
        })),
      });
      navigator.sendBeacon?.(
        `/api/session/${this.token}/beacon`,
        new Blob([payload], { type: "application/json" }),
      );
    } catch {
      /* best effort; the normal queue will retry when the tab comes back */
    }
  }
}

/**
 * A queue that accepts writes and does nothing with them.
 *
 * The preview surface runs the real flow, with the real components and the
 * real stage machine, against a session that does not exist. It has to hand
 * patches somewhere, and they must never reach the server or localStorage.
 */
class NullQueue {
  push() {}
  subscribe(fn: Listener) {
    fn({ pending: 0, failing: false });
    return () => {};
  }
}

export type WriteQueue = Pick<SyncQueue, "push" | "subscribe">;

let cached: { token: string; queue: SyncQueue } | null = null;
const nullQueue = new NullQueue();

export function getQueue(token: string, persist = true): WriteQueue {
  if (!persist) return nullQueue;
  if (cached?.token !== token) cached = { token, queue: new SyncQueue(token) };
  return cached.queue;
}
