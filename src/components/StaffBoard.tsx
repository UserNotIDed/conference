"use client";

import { useEffect, useRef, useState } from "react";
import type { Row } from "@/lib/rows";
import { formatPhone } from "@/lib/ids";
import { PRACTICE } from "@/lib/demo";
import { Check, Spinner } from "@/components/ui";
import { EMPTY } from "@/lib/display";

type Payload = { arrived: Row[]; inProgress: Row[]; now: string };

/**
 * The front desk mirror, on the booth monitor.
 *
 * Polled every two seconds rather than socketed. Nobody standing at a booth can
 * tell the difference, and a poll cannot end up silently disconnected for the
 * back half of the show, which is the failure that actually costs you the
 * demo. A failed poll keeps the last good board on screen and says so quietly;
 * the worst possible behaviour here is a blank screen behind a rep mid-sentence.
 */
export function StaffBoard() {
  const [data, setData] = useState<Payload | null>(null);
  const [stale, setStale] = useState(false);
  const lastArrival = useRef<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/staff", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const next: Payload = await res.json();
        if (!alive) return;
        setData(next);
        setStale(false);

        const newest = next.arrived[0]?.token ?? null;
        if (newest && lastArrival.current && newest !== lastArrival.current) {
          setFlash(newest);
          setTimeout(() => setFlash((f) => (f === newest ? null : f)), 6000);
        }
        lastArrival.current = newest;
      } catch {
        if (alive) setStale(true);
      }
    };
    void tick();
    const id = setInterval(tick, 2000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const arrived = data?.arrived ?? [];
  const inProgress = data?.inProgress ?? [];
  const log = arrived
    .flatMap((r) => r.ehrLog.map((e) => ({ ...e, who: r.patientName })))
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 14);

  return (
    <main className="min-h-dvh px-6 py-6 lg:px-10 lg:py-8">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-teal">
            {PRACTICE.name} · Front desk
          </p>
          <h1 className="mt-1.5 text-[30px] font-extrabold leading-none tracking-[-0.025em] text-ink lg:text-[36px]">
            Today&apos;s arrivals
          </h1>
        </div>
        <div className="flex items-center gap-5">
          <Stat label="Checked in" value={String(arrived.length)} />
          <Stat
            label="Median intake"
            value={medianSeconds(arrived)}
            suffix="s"
          />
          <Stat
            label="Verified"
            value={String(arrived.filter((r) => r.verifyStatus === "complete").length)}
          />
        </div>
      </header>

      {stale ? (
        <p className="mt-4 rounded-[12px] border border-amber-line bg-amber-bg px-4 py-2.5 text-[13px] font-semibold text-amber-dk">
          Lost the connection. Showing the last good board and still trying.
        </p>
      ) : null}

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section>
          {arrived.length === 0 && inProgress.length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-3">
              {inProgress.map((r) => (
                <InProgressCard key={r.token} row={r} />
              ))}
              {arrived.map((r, i) => (
                <ArrivalCard
                  key={r.token}
                  row={r}
                  newest={i === 0}
                  flash={flash === r.token}
                />
              ))}
            </div>
          )}
        </section>

        <aside>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-mute">
            Chart activity
          </h2>
          <div className="mt-3 space-y-2">
            {log.length === 0 ? (
              <p className="text-[13px] text-ink-mute">
                Nothing written yet. It fills in as people finish.
              </p>
            ) : (
              log.map((e, i) => (
                <div
                  key={`${e.at}-${i}`}
                  className="rounded-[12px] border border-hairline bg-white px-3.5 py-2.5"
                >
                  <p className="text-[12.5px] font-medium leading-[1.4] text-ink">
                    {e.line}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-mute">
                    {e.who} · {clock(e.at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function ArrivalCard({
  row,
  newest,
  flash,
}: {
  row: Row;
  newest: boolean;
  flash: boolean;
}) {
  return (
    <article
      className={`rounded-[18px] border bg-white p-5 transition ${
        newest ? "border-teal shadow-[0_4px_24px_0_rgba(11,165,180,0.16)]" : "border-hairline"
      } ${flash ? "animate-pulse-ring" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {newest ? (
            <span className="inline-block rounded-full bg-teal-bg px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-teal">
              Just arrived
            </span>
          ) : null}
          <h3 className="mt-1.5 text-[21px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
            {row.patientName}
          </h3>
          <p className="mt-0.5 text-[13px] font-medium text-ink-sub">
            {row.dob} · {row.appointment} · {row.provider}
          </p>
          <p className="mt-0.5 text-[13px] font-medium text-ink-mute">{row.reason}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-mute">
            Intake
          </p>
          <p className="text-[26px] font-extrabold leading-none tabular-nums text-ink">
            {row.elapsedMs !== null ? `${Math.round(row.elapsedMs / 1000)}s` : EMPTY}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Pill
          tone={row.verifyStatus === "complete" ? "green" : "teal"}
          icon={row.verifyStatus === "complete" ? "check" : "spin"}
        >
          {row.verifyStatus === "complete"
            ? `Aetna PPO active${row.verifySeconds ? ` · ${row.verifySeconds.toFixed(1)}s` : ""}`
            : "Eligibility running"}
        </Pill>
        <Pill tone={row.cardCaptured ? "green" : "grey"} icon={row.cardCaptured ? "check" : null}>
          Card on file
        </Pill>
        <Pill tone={row.signedAt ? "green" : "grey"} icon={row.signedAt ? "check" : null}>
          Consent signed
        </Pill>
      </div>

      {row.signature ? (
        <div className="mt-4 flex items-end justify-between gap-4 border-t border-hairline pt-3">
          <svg
            viewBox="0 0 340 170"
            className="h-[52px] w-auto max-w-[220px] text-ink"
            aria-label={`Signature captured for ${row.patientName}`}
          >
            <path
              d={row.signature}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-mute">
            {formatPhone(row.phone)} · {row.token.toUpperCase()}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function InProgressCard({ row }: { row: Row }) {
  return (
    <article className="rounded-[18px] border border-dashed border-hairline bg-white/60 px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-[16px] font-bold text-ink">{row.patientName}</h3>
          <p className="text-[12.5px] font-medium text-ink-mute">
            Filling in intake now · {row.appointment}
          </p>
        </div>
        <Spinner className="h-5 w-5 text-teal" />
      </div>
    </article>
  );
}

function Pill({
  children,
  tone,
  icon,
}: {
  children: React.ReactNode;
  tone: "green" | "teal" | "grey";
  icon?: "check" | "spin" | null;
}) {
  const styles = {
    green: "border-green/25 bg-green-bg text-ink",
    teal: "border-teal/25 bg-teal-bg text-ink",
    grey: "border-hairline bg-canvas text-ink-sub",
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12px] font-semibold ${styles}`}
    >
      {icon === "check" ? <Check className="h-3 w-3 text-green" /> : null}
      {icon === "spin" ? <Spinner className="h-3 w-3 text-teal" /> : null}
      {children}
    </span>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="text-right">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-mute">
        {label}
      </p>
      <p className="text-[24px] font-extrabold leading-none tabular-nums tracking-[-0.02em] text-ink">
        {value}
        {suffix && value !== EMPTY ? (
          <span className="text-[15px] font-bold text-ink-sub">{suffix}</span>
        ) : null}
      </p>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-[18px] border border-dashed border-hairline bg-white px-6 py-14 text-center">
      <p className="text-[16px] font-bold text-ink">Waiting on the first patient.</p>
      <p className="mt-1.5 text-[13px] font-medium text-ink-sub">
        Scan the code on the counter and this fills in as they go.
      </p>
    </div>
  );
}

function medianSeconds(rows: Row[]): string {
  const values = rows
    .map((r) => r.elapsedMs)
    .filter((v): v is number => typeof v === "number" && v > 0)
    .sort((a, b) => a - b);
  if (values.length === 0) return EMPTY;
  const mid = Math.floor(values.length / 2);
  const ms =
    values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  return String(Math.round(ms / 1000));
}

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}
