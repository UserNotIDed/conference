"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import type { Row } from "@/lib/rows";
import { formatPhone } from "@/lib/ids";
import { pct, usd, usdRounded } from "@/lib/calc";
import { benchmark, benchmarkByRole } from "@/lib/benchmark";
import { ProspectCard } from "@/components/ProspectCard";
import { HubSpotView } from "@/components/HubSpotView";
import { EMPTY } from "@/lib/display";

/**
 * The screen you open when something has gone sideways.
 *
 * Priorities, in order: see every session, get a link into any of them, mint a
 * session by hand when Twilio is not cooperating, and get the whole thing out
 * as CSV. Nothing here is pretty and nothing here should need explaining to a
 * rep who is holding a phone in their other hand.
 */
function fmt(n: number | null, dp = 0): string {
  return n === null ? EMPTY : n.toFixed(dp);
}

function Bench({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-hairline bg-canvas px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-ink-mute">
        {label}
      </p>
      <p className="mt-1 text-[18px] font-extrabold tabular-nums tracking-[-0.02em] text-ink">
        {value}
      </p>
    </div>
  );
}

export function AdminTable({ origin }: { origin: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [practice, setPractice] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  // HubSpot first: it is what the show actually depends on, and the session
  // table is the fallback you reach for when something has gone wrong.
  const [view, setView] = useState<"hubspot" | "sessions">("hubspot");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sessions", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setRows(data.rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  const create = async () => {
    const res = await fetch("/api/admin/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, practiceName: practice }),
    });
    if (res.ok) {
      const { row } = await res.json();
      setPhone("");
      setPractice("");
      await load();
      void copy(`${origin}/d/${row.token}`, row.token);
    }
  };

  const copy = async (text: string, token: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(token);
      setTimeout(() => setCopied((c) => (c === token ? null : c)), 2000);
    } catch {
      window.prompt("Copy this link", text);
    }
  };

  const done = rows.filter((r) => r.finishedAt).length;
  const leads = rows.filter((r) => r.capturedAt).length;
  const optIns = rows.filter((r) => r.captureOptIn).length;
  // The people worth chasing: they left an address but never opened the
  // scheduler.
  const notBooked = rows.filter((r) => r.capturedAt && !r.bookedAt).length;
  const overall = benchmark(rows);
  const byRole = benchmarkByRole(rows);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-teal">
            Yosi booth
          </p>
          <h1 className="mt-1.5 text-[30px] font-extrabold leading-none tracking-[-0.025em] text-ink">
            {view === "hubspot" ? "HubSpot" : "Sessions"}
          </h1>
          <p className="mt-2 text-[13px] font-medium text-ink-sub">
            {rows.length} started · {done} finished intake · {leads} left an
            address · {optIns} want the benchmark ·{" "}
            <span className="font-bold text-amber-dk">
              {notBooked} to retarget
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-[14px] border border-hairline bg-white p-1">
            {(["hubspot", "sessions"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`min-h-[36px] rounded-[10px] px-3.5 text-[13px] font-bold transition ${
                  view === v ? "bg-ink text-white" : "text-ink-sub"
                }`}
              >
                {v === "hubspot" ? "HubSpot fields" : "Sessions"}
              </button>
            ))}
          </div>
          {/* Same property names as the submit, so a failed POST is
              recoverable by importing the file. */}
          <a
            href="/api/admin/export"
            className="inline-flex min-h-[44px] items-center rounded-[14px] bg-blue px-5 text-[14px] font-bold text-white"
          >
            Export CSV
          </a>
        </div>
      </header>

      {view === "hubspot" ? (
        <div className="mt-6">
          <HubSpotView rows={rows} />
        </div>
      ) : (
      <>

      <section className="mt-6 rounded-[16px] border border-hairline bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-mute">
            Front desk benchmark
          </p>
          <p className="text-[12px] text-ink-mute">
            {overall.n} practice{overall.n === 1 ? "" : "s"} · medians
          </p>
        </div>
        <p className="mt-1.5 text-[13px] text-ink-sub">
          This is the report the opt-in promises. It is only worth sending once
          the sample is big enough to mean something. Aim for 40 or so.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Bench label="Patients / day" value={fmt(overall.patientsPerDay)} />
          <Bench
            label="No-show"
            value={overall.noShowRate === null ? EMPTY : pct(overall.noShowRate)}
          />
          <Bench label="Front desk FTE" value={fmt(overall.frontDeskStaff)} />
          <Bench
            label="Patients per FTE"
            value={fmt(overall.patientsPerStaff, 1)}
          />
          <Bench
            label="Annual leak"
            // Rounded: $246,285 as a *median across practices* is false
            // precision, and false precision is what gets a benchmark argued
            // with on the wrong grounds.
            value={overall.leak === null ? EMPTY : usdRounded(overall.leak)}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
          {byRole.map(({ role, stats }) => (
            <p key={role.id} className="text-[12px] text-ink-mute">
              <span className="font-semibold text-ink-sub">{role.label}</span>{" "}
              n={stats.n}
              {stats.patientsPerStaff !== null
                ? ` · ${fmt(stats.patientsPerStaff, 1)} patients per FTE`
                : ""}
            </p>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[16px] border border-hairline bg-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-mute">
          Start a session by hand
        </p>
        <p className="mt-1.5 text-[13px] text-ink-sub">
          For when the text does not arrive, or someone will not scan a stranger&apos;s
          QR code. Leave the number blank and you get a placeholder. The demo
          still runs, you just cannot text them the result afterwards.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(214) 555-0148"
            inputMode="tel"
            className="h-[46px] min-w-[190px] flex-1 rounded-[12px] border border-hairline px-3.5 text-[15px] font-medium outline-none focus:border-teal"
          />
          <input
            value={practice}
            onChange={(e) => setPractice(e.target.value)}
            placeholder="Practice name (pre-fills their capture screen)"
            className="h-[46px] min-w-[260px] flex-[2] rounded-[12px] border border-hairline px-3.5 text-[15px] font-medium outline-none focus:border-teal"
          />
          <button
            onClick={create}
            className="h-[46px] rounded-[12px] bg-ink px-5 text-[14px] font-bold text-white"
          >
            Create and copy link
          </button>
        </div>
      </section>

      <div className="mt-6 overflow-x-auto rounded-[16px] border border-hairline bg-white">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline">
              {[
                "",
                "Code",
                "Name",
                "Practice",
                "Role",
                "EHR",
                "Intake",
                "Leak est.",
                "Booked",
                "Started",
              ].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-mute"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-[13px] text-ink-mute">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-[13px] text-ink-mute">
                  No sessions yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <Fragment key={r.token}>
                  <tr className="border-b border-hairline last:border-0">
                    <td className="pl-3">
                      <button
                        onClick={() => setOpen(open === r.token ? null : r.token)}
                        aria-expanded={open === r.token}
                        aria-label={`Show everything about ${r.captureName || r.token}`}
                        className="flex h-8 w-8 items-center justify-center rounded-[8px] text-ink-mute transition hover:bg-canvas"
                      >
                        <span className={open === r.token ? "rotate-90" : ""}>›</span>
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => copy(`${origin}/d/${r.token}`, r.token)}
                        className="font-mono text-[13px] font-bold text-teal"
                        title="Copy the attendee link"
                      >
                        {copied === r.token ? "copied!" : r.token.toUpperCase()}
                      </button>
                      {r.keyword ? (
                        <span className="ml-2 text-[11px] font-semibold text-ink-mute">
                          {r.keyword}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 text-[13px] font-medium text-ink">
                      {r.captureName || (
                        <span className="text-ink-mute">{formatPhone(r.phone)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-[13px] text-ink-sub">
                      {r.capturePractice || EMPTY}
                    </td>
                    <td className="px-3 py-2.5 text-[13px] text-ink-sub">{r.roleLabel}</td>
                    <td className="px-3 py-2.5 text-[13px] text-ink-sub">
                      {r.ehrSystem || EMPTY}
                    </td>
                    <td className="px-3 py-2.5 text-[13px] font-bold tabular-nums text-ink">
                      {r.elapsedMs !== null ? `${(r.elapsedMs / 1000).toFixed(0)}s` : EMPTY}
                    </td>
                    <td className="px-3 py-2.5 text-[13px] font-semibold tabular-nums text-ink">
                      {r.calcTotal ? usd(r.calcTotal) : EMPTY}
                      {r.calcSmsAt ? (
                        <span className="ml-1.5 text-[11px] text-ink-mute">texted</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 text-[13px]">
                      {r.bookedSlot ? (
                        <span className="font-semibold text-green">
                          {r.bookedSlot}
                        </span>
                      ) : r.capturedAt ? (
                        <span className="font-semibold text-amber-dk">retarget</span>
                      ) : (
                        <span className="text-ink-mute">{EMPTY}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-[12px] tabular-nums text-ink-mute">
                      {new Date(r.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                  {open === r.token ? (
                    <tr>
                      <td colSpan={10} className="p-0">
                        <ProspectCard row={r} origin={origin} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      </>
      )}
    </main>
  );
}
