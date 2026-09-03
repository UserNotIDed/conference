"use client";

import type { Row } from "@/lib/rows";
import { formatPhone } from "@/lib/ids";
import { pct, usd } from "@/lib/calc";

/**
 * One prospect, whole, on one screen.
 *
 * The table is for scanning; this is for the moment someone says "pull up the
 * woman from Cedar Park." It answers, in order: who are they, what do they run,
 * what are their numbers, and what did they actually do in the demo — the last
 * one being the part a rep can open a call with two weeks later.
 */
export function ProspectCard({ row, origin }: { row: Row; origin: string }) {
  const qualified = row.techStack.length > 0;

  return (
    <div className="border-t border-hairline bg-canvas px-5 py-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <section>
          <H>Who</H>
          <p className="mt-2 text-[17px] font-extrabold tracking-[-0.01em] text-ink">
            {row.captureName || "— no name given"}
          </p>
          <p className="text-[13px] font-medium text-ink-sub">
            {row.capturePractice || "— no practice given"}
          </p>
          <dl className="mt-3 space-y-1.5">
            <F k="Role" v={row.roleLabel} />
            <F k="Email" v={row.captureEmail ?? "—"} />
            <F k="Mobile" v={formatPhone(row.phone)} />
            <F k="Ships to" v={row.captureAddress ?? "—"} />
            <F
              k="Booking"
              v={row.bookedSlot ?? (row.bookedAt ? "Opened, no slot" : "Not booked — retarget")}
              strong={!row.bookedSlot}
            />
            <F
              k="Benchmark"
              v={row.captureOptIn ? "Wants the report" : "Did not opt in"}
            />
            <F k="Came in via" v={row.keyword ?? row.source} />
          </dl>
        </section>

        <section>
          <H>What they run</H>
          {qualified ? (
            <dl className="mt-2 space-y-1.5">
              <F k="EHR / PM" v={row.ehrSystem ?? "—"} />
              <F k="Stack" v={row.techStack.join(", ") || "—"} />
              {row.competitorTool ? (
                <F
                  k={row.competitorTool}
                  v={row.competitorSatisfaction ?? "no answer"}
                  strong
                />
              ) : null}
            </dl>
          ) : (
            <p className="mt-2 text-[13px] text-ink-mute">
              Didn&apos;t reach the qualifying questions.
            </p>
          )}

          <H className="mt-5">Their numbers</H>
          {row.calcInputs ? (
            <dl className="mt-2 space-y-1.5">
              <F k="Patients / day" v={String(row.calcInputs.patientsPerDay)} />
              <F k="No-show" v={pct(row.calcInputs.noShowRate ?? 0)} />
              <F k="Front desk" v={String(row.calcInputs.frontDeskStaff)} />
              <F
                k="Per FTE"
                v={
                  row.calcInputs.frontDeskStaff
                    ? (
                        (row.calcInputs.patientsPerDay ?? 0) /
                        row.calcInputs.frontDeskStaff
                      ).toFixed(1)
                    : "—"
                }
              />
              <F
                k="Annual leak"
                v={row.calcTotal ? usd(row.calcTotal) : "—"}
                strong
              />
              <F
                k="Texted to them"
                v={row.calcSmsAt ? "Yes" : "No"}
              />
            </dl>
          ) : (
            <p className="mt-2 text-[13px] text-ink-mute">
              Didn&apos;t run the calculator.
            </p>
          )}
        </section>

        <section>
          <H>What they did in the demo</H>
          <dl className="mt-2 space-y-1.5">
            <F
              k="Intake"
              v={
                row.elapsedMs !== null
                  ? `Finished in ${Math.round(row.elapsedMs / 1000)}s`
                  : "Did not finish"
              }
            />
            <F
              k="Eligibility"
              v={
                row.verifySeconds !== null
                  ? `Verified in ${row.verifySeconds.toFixed(1)}s`
                  : row.verifyStatus
              }
            />

            <F
              k="Copay"
              v={
                row.paidAt
                  ? `Paid $${((row.copayCents ?? 0) / 100).toFixed(2)}`
                  : "Not collected"
              }
            />
          </dl>

          <H className="mt-5">Link</H>
          <p className="mt-2 break-all font-mono text-[12px] text-teal">
            {origin}/d/{row.token}
          </p>
          {row.calcTotal ? (
            <p className="mt-1 break-all font-mono text-[12px] text-ink-mute">
              {origin}/r/{row.token}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function H({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h4
      className={`text-[10px] font-bold uppercase tracking-[0.08em] text-ink-mute ${className}`}
    >
      {children}
    </h4>
  );
}

function F({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-[12px] font-medium text-ink-mute">{k}</dt>
      <dd
        className={`text-right text-[12.5px] ${
          strong ? "font-extrabold text-ink" : "font-semibold text-ink"
        }`}
      >
        {v}
      </dd>
    </div>
  );
}
