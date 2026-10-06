"use client";

import { YosiLogo } from "@/components/YosiLogo";
import {
  ASSUMPTIONS,
  calculate,
  growth,
  pct,
  recovery,
  usd,
  usdRounded,
  type CalcInputs,
} from "@/lib/calc";
import { TONE, biggestGap, score } from "@/lib/score";
import { SERVICES, tierFor } from "@/lib/services";

/**
 * The readout, as the prospect sees it.
 *
 * This is the half that gets screen-shared, so it is written to be read by the
 * person being sold to rather than by the rep selling. No internal shorthand,
 * no rate, no plan price, and the answers it was built from printed along the
 * top: on a call the first question is always where the numbers came from.
 *
 * Bento rather than a column. A readout is not an argument with a beginning
 * and an end, it is a board somebody scans in the ten seconds before they
 * start talking, and tiles let the eye pick its own order. It also screenshots
 * into a deck as one object instead of three.
 *
 * Every size is in `cqw`, one per cent of the card's own width, and the card
 * is locked to 16:9. The composition on screen and the composition in the
 * screenshot are therefore identical at any window size.
 */
export function Readout({
  inputs,
  practice,
  locations,
  monthlyRate,
  techStack,
  intakeSatisfaction,
  onlineBooking,
  asksForReviews,
  interests,
  concerns,
}: {
  inputs: CalcInputs;
  practice: string;
  locations: number;
  monthlyRate: number | null;
  techStack: string[];
  intakeSatisfaction: string | null;
  onlineBooking: boolean;
  asksForReviews: boolean;
  interests: string[];
  concerns: string;
}) {
  const leak = calculate(inputs);
  const back = recovery(leak);
  const up = growth(leak, { onlineBooking, asksForReviews });
  const noShow = up.opportunities.find((o) => o.key === "noshow");
  const health = score({
    inputs,
    techStack,
    intakeSatisfaction,
    onlineBooking,
    asksForReviews,
  });
  const gap = biggestGap(health);

  const per = (annual: number) => annual / inputs.providers / 12;
  const annualCost = monthlyRate ? monthlyRate * inputs.providers * 12 : null;
  const multiple = annualCost && annualCost > 0 ? back.total / annualCost : null;
  const net = annualCost === null ? null : back.total - annualCost;
  const tier = tierFor(interests);

  const chips = [
    `${inputs.providers} providers`,
    locations > 1 ? `${locations} locations` : "1 location",
    `${inputs.patientsPerDay}/day`,
    `${pct(inputs.noShowRate)} no-show`,
    `${inputs.frontDeskStaff} front desk`,
    `${pct(inputs.collectedRate)} collected`,
  ];

  return (
    <div
      className="relative aspect-[16/9] w-full overflow-hidden bg-canvas"
      style={{ containerType: "inline-size" }}
    >
      <div className="flex h-full flex-col gap-[0.8cqw] p-[1.9cqw]">
        {/* Header */}
        <header className="flex items-start justify-between gap-[2cqw]">
          <div className="min-w-0">
            <p className="text-[0.8cqw] font-bold uppercase tracking-[0.1em] text-teal">
              Front desk readout
            </p>
            <h1 className="truncate text-[2.1cqw] font-extrabold leading-[1.15] tracking-[-0.025em] text-ink">
              {practice}
            </h1>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-[0.4cqw]">
            {chips.map((c) => (
              <span
                key={c}
                className="rounded-full bg-white px-[0.7cqw] py-[0.25cqw] text-[0.8cqw] font-semibold text-ink-sub"
              >
                {c}
              </span>
            ))}
            <YosiLogo className="ml-[0.6cqw] h-[1.8cqw]" />
          </div>
        </header>

        {/* Bento */}
        <div className="grid flex-1 grid-cols-12 grid-rows-6 gap-[0.8cqw]">
          {/* ROI, the lede. Return, not spend. */}
          <Tile span="col-span-5 row-span-3" surface="ink" flush>
            <div className="flex h-full flex-col justify-between p-[1.3cqw]">
              <div>
                <p className="text-[0.8cqw] font-bold uppercase tracking-[0.07em] text-white/55">
                  {multiple ? "Return on what you'd spend" : "What we'd put back"}
                </p>
                <p className="mt-[0.3cqw] text-[4.4cqw] font-extrabold leading-[0.85] tracking-[-0.04em] text-white tabular-nums">
                  {multiple ? `${multiple.toFixed(1)}x` : usdRounded(back.total)}
                </p>
                <p className="mt-[0.5cqw] text-[1.1cqw] font-bold leading-[1.3] text-white">
                  {multiple
                    ? `${usdRounded(back.total)} back a year, ${usdRounded(net ?? 0)} of it net`
                    : `${usd(per(back.total))} per provider, per month`}
                </p>
              </div>
              <div className="flex gap-[1.4cqw] border-t border-white/15 pt-[0.7cqw]">
                <Mini label="A year" value={usdRounded(back.total)} />
                <Mini
                  label="Per provider / mo"
                  value={usd(per(back.total))}
                />
                <Mini
                  label="Desk hours a year"
                  value={Math.round(up.hoursFreed).toLocaleString("en-US")}
                />
              </div>
            </div>
          </Tile>

          {/* Health score, with the graphic. */}
          <Tile span="col-span-3 row-span-3">
            <Kicker>Practice health</Kicker>
            <div className="mt-[0.5cqw] flex items-center gap-[0.9cqw]">
              <ScoreRing value={health.total} tone={health.band.tone} />
              <div className="min-w-0">
                <p
                  className="text-[1.1cqw] font-extrabold uppercase leading-[1.2] tracking-[0.04em]"
                  style={{ color: TONE[health.band.tone].solid }}
                >
                  {health.band.label}
                </p>
                <p className="mt-[0.25cqw] text-[0.85cqw] leading-[1.35] text-ink-sub">
                  {health.band.blurb}
                </p>
              </div>
            </div>
            <div className="mt-[0.7cqw] space-y-[0.3cqw]">
              {health.dimensions.map((d) => (
                <div key={d.key} className="flex items-center gap-[0.5cqw]">
                  <span className="w-[8.6cqw] shrink-0 truncate text-[0.78cqw] font-semibold text-ink-sub">
                    {d.label}
                  </span>
                  <span className="h-[0.45cqw] flex-1 overflow-hidden rounded-full bg-hairline">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${d.value}%`,
                        background: TONE[
                          d.value >= 80
                            ? "good"
                            : d.value >= 65
                              ? "ok"
                              : d.value >= 50
                                ? "warn"
                                : "bad"
                        ].solid,
                      }}
                    />
                  </span>
                  <span className="w-[1.6cqw] shrink-0 text-right text-[0.78cqw] font-extrabold tabular-nums text-ink">
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-[0.5cqw] text-[0.78cqw] leading-[1.35] text-ink-mute">
              Most to gain: {gap.label.toLowerCase()}.
            </p>
          </Tile>

          {/* The separate opportunity. */}
          <Tile span="col-span-4 row-span-3" surface="amber">
            <Kicker tone="amber">
              Separate opportunity · scheduling and reminders
            </Kicker>
            <p className="mt-[0.3cqw] text-[2.7cqw] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
              {usdRounded(noShow?.amount ?? 0)}
            </p>
            <p className="mt-[0.3cqw] text-[0.95cqw] font-bold text-ink">
              {usd(per(noShow?.amount ?? 0))} per provider, per month
            </p>
            <p className="mt-[0.2cqw] text-[0.78cqw] font-medium text-ink-mute">
              {noShow?.basis}
            </p>
            <p className="mt-[0.6cqw] border-t border-amber-line pt-[0.5cqw] text-[0.85cqw] leading-[1.4] text-ink-sub">
              Not in the figures to the left. A no-show is a scheduling problem,
              not an intake one: reminders, confirmations, two-way messaging and
              self-scheduling are what move it. We show the cost and claim no
              share of it.
            </p>
          </Tile>

          {/* Where it comes from, with the evidence attached. */}
          <Tile span="col-span-8 row-span-3">
            <div className="flex items-baseline justify-between">
              <Kicker>Where it comes from, and where the figures come from</Kicker>
              <span className="text-[0.78cqw] font-bold text-ink-mute">
                {usdRounded(leak.total)} a year
              </span>
            </div>
            <table className="mt-[0.4cqw] w-full border-collapse">
              <tbody>
                {leak.components.map((c) => {
                  const removed =
                    back.lines.find((l) => l.key === c.key)?.amount ?? 0;
                  return (
                    <tr key={c.key} className="border-b border-hairline/60">
                      <td className="py-[0.3cqw] pr-[0.5cqw] align-top">
                        <span className="block text-[0.95cqw] font-semibold leading-[1.25] text-ink">
                          {c.label}
                        </span>
                        <span className="block text-[0.72cqw] font-medium leading-[1.3] text-ink-mute">
                          {c.formula}
                        </span>
                      </td>
                      <td className="w-[6cqw] py-[0.3cqw] text-right align-top text-[0.95cqw] font-medium tabular-nums text-ink-sub">
                        {usd(c.amount)}
                      </td>
                      <td className="w-[6cqw] py-[0.3cqw] pl-[0.4cqw] text-right align-top text-[0.95cqw] font-extrabold tabular-nums text-teal">
                        {usd(removed)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-[0.45cqw] text-[0.72cqw] leading-[1.4] text-ink-mute">
              <span className="font-bold text-ink-sub">Evidence:</span>{" "}
              {ASSUMPTIONS.avgVisitRevenue.display} a visit and the{" "}
              {ASSUMPTIONS.denialRate.display} denial rate are MGMA;{" "}
              {ASSUMPTIONS.frontDeskHourlyRate.display} is the BLS median wage;{" "}
              {ASSUMPTIONS.minutesPerIntakeToday.display} on registration and{" "}
              {ASSUMPTIONS.adminCostPerIntake.display} of paper per intake are
              NIH-indexed time and cost studies. Patient balances are our own
              estimate and are marked as such. Industry benchmarks, not Yosi
              customer results.
            </p>
          </Tile>

          {/* What they said they want. */}
          <Tile span="col-span-4 row-span-3">
            <div className="flex items-baseline justify-between">
              <Kicker>What you asked about</Kicker>
              {tier ? (
                <span className="rounded-full bg-blue px-[0.6cqw] py-[0.15cqw] text-[0.72cqw] font-bold text-white">
                  {tier}
                </span>
              ) : null}
            </div>
            {interests.length === 0 ? (
              <p className="mt-[0.4cqw] text-[0.85cqw] text-ink-pale">
                Nothing ticked yet.
              </p>
            ) : (
              <div className="mt-[0.4cqw] flex flex-wrap gap-[0.3cqw]">
                {SERVICES.filter((s) => interests.includes(s.id)).map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full border border-teal/30 bg-teal-bg px-[0.6cqw] py-[0.2cqw] text-[0.78cqw] font-semibold text-ink"
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            )}
            {concerns.trim() ? (
              <div className="mt-[0.7cqw] border-t border-hairline pt-[0.5cqw]">
                <Kicker>Also on your mind</Kicker>
                <p className="mt-[0.25cqw] text-[0.85cqw] italic leading-[1.4] text-ink-sub">
                  &ldquo;{concerns.trim()}&rdquo;
                </p>
              </div>
            ) : null}
          </Tile>
        </div>

        <p className="text-[0.68cqw] leading-[1.4] text-ink-mute">
          An estimator, not an audit. Built from the answers above and published
          benchmarks; what a practice actually sees depends on payer mix,
          schedule and how the front desk runs today.
        </p>
      </div>
    </div>
  );
}

/**
 * A bento tile.
 *
 * No background or border colour in the base, on purpose. Two background
 * utilities on one element resolve by CSS source order rather than by the
 * order they are written, so a base `bg-white` silently beat the `bg-ink` a
 * caller passed and the dark tile rendered white text on white. That has now
 * happened twice in this codebase. Making the caller state the surface is the
 * only version of this component that cannot do it again.
 */
const SURFACE = {
  white: "border-hairline bg-white",
  ink: "border-ink bg-ink",
  amber: "border-amber-line bg-amber-bg",
} as const;

function Tile({
  children,
  span,
  surface = "white",
  flush,
}: {
  children: React.ReactNode;
  span: string;
  surface?: keyof typeof SURFACE;
  flush?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[0.9cqw] border ${SURFACE[surface]} ${
        flush ? "" : "p-[1cqw]"
      } ${span}`}
    >
      {children}
    </div>
  );
}

function Kicker({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "amber";
}) {
  return (
    <p
      className={`text-[0.75cqw] font-bold uppercase tracking-[0.07em] ${
        tone === "amber" ? "text-amber-dk" : "text-ink-mute"
      }`}
    >
      {children}
    </p>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.68cqw] font-bold uppercase tracking-[0.06em] text-white/45">
        {label}
      </p>
      <p className="text-[1.1cqw] font-extrabold leading-tight text-white tabular-nums">
        {value}
      </p>
    </div>
  );
}

/**
 * The ring again, in cqw.
 *
 * ReadinessRing takes a pixel size, which is right for a phone screen and
 * wrong inside a card whose whole point is that it scales with its container:
 * a fixed 96px ring in a 7.6cqw box overflowed and sat on top of the band
 * label. A viewBox and percentage radii cost twenty lines and scale with
 * everything else on the slide.
 */
function ScoreRing({ value, tone }: { value: number; tone: keyof typeof TONE }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: "7.2cqw", height: "7.2cqw" }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="15" stroke="#eef2f6" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="15"
          strokeLinecap="round"
          stroke={TONE[tone].solid}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[2.1cqw] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
          {Math.round(value)}
        </span>
      </div>
    </div>
  );
}
