"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, CapLabel, Check, Screen } from "@/components/ui";
import { Alert } from "@/components/Alert";
import { ReadinessRing } from "@/components/ReadinessRing";
import { YosiLogo } from "@/components/YosiLogo";
import { FLOW, fill } from "@/lib/flow-content";
import { BOOKING_URL } from "@/lib/booking";
import {
  allConstants,
  calculate,
  orderComponents,
  pct,
  roi,
  roleLead,
  usd,
  usdRounded,
  type CalcInputs,
} from "@/lib/calc";
import {
  TONE,
  biggestGap,
  score,
  toneFor,
  type ScoreDimension,
} from "@/lib/score";
import type { ClientSession } from "@/lib/session";
import { useCountUp } from "./CountUp";
import { EMPTY } from "@/lib/display";

/* -------------------------------------------------------------------------
 * The diagnosis, in two screens.
 *
 * Score first, money second. A score answers "where do I stand", which is the
 * question the landing page asked; the money answers "so what", which is the
 * question that books a meeting. Putting both on one screen makes the reader
 * choose which one to look at, and at a booth they choose neither.
 * ------------------------------------------------------------------------- */

export function ScreenScore({
  session,
  inputs,
  onNext,
}: {
  session: ClientSession;
  inputs: CalcInputs;
  onNext: () => void;
}) {
  const result = useMemo(
    () =>
      score({
        inputs,
        techStack: session.techStack,
        competitorSatisfaction: session.competitorSatisfaction,
      }),
    [inputs, session.techStack, session.competitorSatisfaction],
  );
  const shown = useCountUp(result.total, 900);
  const [open, setOpen] = useState(false);
  const gap = biggestGap(result);
  const practice = session.capture.practice || session.practiceName;

  return (
    <Screen
      footer={<Button onClick={onNext}>{FLOW.score.cta}</Button>}
    >
      <div className="animate-fade-up pt-6">
        <CapLabel>{FLOW.score.kicker}</CapLabel>

        <div className="mt-4 flex items-center gap-5">
          <ReadinessRing
            percent={result.total}
            size={124}
            tone={result.band.tone}
            display={String(Math.round(shown))}
            caption={result.band.label}
          />
          <div className="min-w-0">
            <h1 className="text-[21px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink">
              {fill(practice ? FLOW.score.titleNamed : FLOW.score.title, {
                practice: practice ?? "",
                score: result.total,
              })}
            </h1>
            <p className="mt-2 text-[13.5px] font-medium leading-[1.45] text-ink-sub">
              {result.band.blurb}
            </p>
          </div>
        </div>

        <div className="mt-7">
          <CapLabel>{FLOW.score.weightsLabel}</CapLabel>
          <p className="mt-1.5 text-[12px] text-ink-mute">{FLOW.score.weightNote}</p>
          <div className="mt-3 space-y-2.5">
            {result.dimensions.map((d) => (
              <DimensionRow key={d.key} d={d} flagged={d.key === gap.key} />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-4 min-h-[44px] text-[13px] font-bold text-teal"
        >
          {open ? FLOW.score.hideDisclosure : FLOW.score.disclosure}
        </button>

        {open ? (
          <div className="space-y-3 rounded-[14px] border border-hairline bg-white p-4">
            <p className="text-[12.5px] leading-[1.5] text-ink-sub">
              {FLOW.score.disclosureBody}
            </p>
            {result.dimensions.map((d) => (
              <div key={d.key} className="border-t border-hairline pt-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-semibold text-ink">{d.label}</span>
                  <span className="shrink-0 text-[12px] font-bold tabular-nums text-ink-mute">
                    weight {d.weight}
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-[1.45] text-ink-mute">
                  {d.basis}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-5">
          {/* Where the most score is available, named. A score with no "so
              what" is a horoscope; this is the one line the follow-up email
              should lead with too. */}
          <Alert tone={result.band.tone === "good" ? "success" : "info"}>
            <strong className="font-bold">
              {fill(FLOW.score.weakestLabel, { label: gap.label.toLowerCase() })}
            </strong>{" "}
            {gap.note}
          </Alert>
        </div>
      </div>
    </Screen>
  );
}

function DimensionRow({
  d,
  flagged,
}: {
  d: ScoreDimension;
  /** The one with the most score available. */
  flagged: boolean;
}) {
  // Same four breakpoints as the ring and the follow-up email. They all read
  // score.ts rather than each keeping their own idea of what 64 looks like.
  const colours = TONE[toneFor(d.value)];
  return (
    <div
      className={`rounded-[14px] border bg-white px-4 py-3 ${
        flagged ? "border-amber-line bg-amber-bg/40" : "border-hairline"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[14px] font-semibold text-ink">
          {d.label}
          {/* A border on one row with no legend is noise. Say what it means. */}
          {flagged ? (
            <span className="ml-2 whitespace-nowrap rounded-full bg-amber-strong px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-white">
              Most to gain
            </span>
          ) : null}
        </span>
        <span className="shrink-0 tabular-nums">
          <span
            className="text-[16px] font-extrabold"
            style={{ color: colours.solid }}
          >
            {d.value}
          </span>
          <span className="text-[11px] font-bold text-ink-pale"> / 100</span>
        </span>
      </div>
      <div className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-hairline">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${d.value}%`,
            backgroundImage: `linear-gradient(90deg, ${colours.from}, ${colours.to})`,
          }}
        />
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className="text-[12px] font-medium text-ink-sub">{d.detail}</span>
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-pale">
          {d.weight}% of score
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

export function ScreenMoney({
  session,
  inputs,
  onBenchmark,
  onNext,
}: {
  session: ClientSession;
  inputs: CalcInputs;
  onBenchmark: (optIn: boolean) => void;
  onNext: () => void;
}) {
  const result = useMemo(() => calculate(inputs), [inputs]);
  const ret = useMemo(() => roi(result), [result]);
  const ordered = orderComponents(result, session.role);
  const lead = roleLead(result, session.role);
  const shown = useCountUp(result.total, 1000);
  const [showWork, setShowWork] = useState(false);
  // Pre-checked: they have just been shown a number, and "how do I compare" is
  // the question they are already asking. Opting out is one tap.
  const [optIn, setOptIn] = useState(session.capture.optIn ?? true);

  // A default nobody taps is still a choice, and it has to reach the record,
  // otherwise every pre-ticked box reads as "declined" in the export. Written
  // once on mount, and only when they have not already answered.
  useEffect(() => {
    if (session.capture.optIn === null || session.capture.optIn === undefined) {
      onBenchmark(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const M = FLOW.money;

  return (
    <Screen footer={<Button onClick={onNext}>{M.cta}</Button>}>
      <div className="animate-fade-up pt-6">
        <CapLabel>{M.kicker}</CapLabel>
        <p className="mt-1.5 text-[44px] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
          {usdRounded(shown)}
        </p>
        {lead ? (
          <p className="mt-2.5 text-[14px] font-medium text-ink-sub">{lead}</p>
        ) : null}

        <div className="mt-6 space-y-2.5">
          {ordered.map((c) => (
            <div
              key={c.key}
              className="rounded-[14px] border border-hairline bg-white px-4 py-3.5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[14px] font-semibold text-ink">{c.label}</span>
                <span className="shrink-0 text-[15px] font-extrabold tabular-nums text-ink">
                  {usd(c.amount)}
                </span>
              </div>
              <p className="mt-1 text-[12px] font-medium leading-[1.45] text-ink-mute">
                {c.formula}
              </p>
              {c.note ? (
                <p className="mt-1.5 text-[12px] leading-[1.45] text-ink-sub">
                  {c.note}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        {/* ---- The return. Separated by a rule and a tint so it reads as a
               second, different claim rather than more of the same list. ---- */}
        <div className="mt-7 rounded-[18px] border border-teal/25 bg-teal-bg p-4">
          <CapLabel>{M.roiKicker}</CapLabel>
          <p className="mt-1.5 text-[24px] font-extrabold leading-[1.15] tracking-[-0.025em] text-ink">
            {fill(M.roiHeadline, { net: usdRounded(ret.net) })}
          </p>
          <p className="mt-2 text-[13px] font-medium leading-[1.45] text-ink-sub">
            {fill(M.roiSub, {
              multiple: `$${ret.multiple.toFixed(2)}`,
              months: payback(ret.paybackMonths),
            })}
          </p>

          <div className="mt-4 rounded-[14px] border border-teal/15 bg-white p-3.5">
            <CapLabel>{M.roiRecoveredLabel}</CapLabel>
            <div className="mt-2 space-y-1.5">
              {ret.lines.map((l) => (
                <div key={l.key} className="flex items-baseline justify-between gap-3">
                  <span className="text-[12.5px] font-medium text-ink-sub">
                    {l.label}{" "}
                    <span className="text-ink-pale">
                      ({pct(l.rate)} of {usd(l.leak)})
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] font-bold tabular-nums text-ink">
                    {usd(l.amount)}
                  </span>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-3 border-t border-hairline pt-2">
                <span className="text-[13px] font-bold text-ink">Recovered</span>
                <span className="text-[14px] font-extrabold tabular-nums text-green">
                  {usd(ret.recovered)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2.5 rounded-[14px] border border-teal/15 bg-white p-3.5">
            <CapLabel>{M.roiCostLabel}</CapLabel>
            <div className="mt-2 space-y-1.5">
              {ret.costLines.map((l) => (
                <div
                  key={l.label}
                  className="flex items-baseline justify-between gap-3"
                >
                  <span className="text-[12.5px] font-medium text-ink-sub">
                    {l.label}{" "}
                    <span className="text-ink-pale">({l.formula})</span>
                  </span>
                  <span className="shrink-0 text-[13px] font-bold tabular-nums text-ink">
                    {usd(l.amount)}
                  </span>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-3 border-t border-hairline pt-2">
                <span className="text-[13px] font-bold text-ink">Cost</span>
                <span className="text-[14px] font-extrabold tabular-nums text-ink">
                  {usd(ret.cost)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowWork((v) => !v)}
          className="mt-4 min-h-[44px] text-[13px] font-bold text-teal"
        >
          {showWork ? M.hideWork : M.showWork}
        </button>

        {showWork ? (
          <div className="space-y-3 rounded-[14px] border border-hairline bg-white p-4">
            <p className="text-[12.5px] leading-[1.5] text-ink-sub">
              {M.assumptionsIntro}
            </p>
            {allConstants().map((a) => (
              <div key={a.label} className="border-t border-hairline pt-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-semibold text-ink">{a.label}</span>
                  <span className="shrink-0 text-[13px] font-bold tabular-nums text-ink">
                    {a.display}
                  </span>
                </div>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] ${
                    a.status === "placeholder"
                      ? "bg-amber-bg text-amber-dk"
                      : "bg-canvas text-ink-mute"
                  }`}
                >
                  {a.status === "placeholder" ? M.placeholderTag : M.sourcedTag}
                </span>
                <p className="mt-1.5 text-[12px] leading-[1.45] text-ink-mute">
                  {a.source}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <p className="mt-4 text-[12px] leading-[1.5] text-ink-mute">
          Based on {inputs.patientsPerDay} patients a day, {pct(inputs.noShowRate)}{" "}
          no-show, {inputs.frontDeskStaff} at the front desk and{" "}
          {pct(inputs.collectedRate)} collected up front.
        </p>

        <div className="mt-6 rounded-[14px] border border-hairline bg-white p-4">
          <p className="text-[14px] font-semibold text-ink">{M.benchmarkTitle}</p>
          <p className="mt-1 text-[12.5px] leading-[1.5] text-ink-sub">
            {M.benchmarkBody}
          </p>
          <button
            type="button"
            onClick={() => {
              const next = !optIn;
              setOptIn(next);
              onBenchmark(next);
            }}
            aria-pressed={optIn}
            className="mt-3 flex w-full items-center gap-3 text-left"
          >
            <span
              className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border transition ${
                optIn ? "border-teal bg-teal text-white" : "border-hairline bg-white"
              }`}
            >
              {optIn ? <Check className="h-3 w-3" /> : null}
            </span>
            <span className="text-[13.5px] font-semibold leading-[1.4] text-ink">
              {M.benchmarkOptIn}
            </span>
          </button>
        </div>
      </div>
    </Screen>
  );
}

function payback(months: number): string {
  if (!Number.isFinite(months)) return EMPTY;
  if (months < 1) return "under a month";
  if (months < 1.5) return "about a month";
  return `${Math.round(months)} months`;
}

/* ------------------------------------------------------------------------- */

export function ScreenThanks({
  session,
  leakTotal,
  onBooked,
}: {
  session: ClientSession;
  /**
   * Passed in rather than read off the session: the page was server-rendered
   * before the calculator ran, so the snapshot has no result and the headline
   * would fall back to the generic line, losing the one number that makes
   * this screen a close rather than a thank-you.
   */
  leakTotal: number | null;
  onBooked: () => void;
}) {
  const [opened, setOpened] = useState(Boolean(session.capture.bookedAt));

  return (
    <Screen
      kicker={FLOW.booking.kicker}
      title={
        leakTotal
          ? fill(FLOW.booking.title, { leak: usdRounded(leakTotal) })
          : FLOW.booking.titleNoLeak
      }
      subtitle={FLOW.booking.subtitle}
      footer={
        <>
          {/* target=_blank so the click records and this page does not unload
              mid-request. Everyone without the stamp is the retarget list. */}
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              setOpened(true);
              onBooked();
            }}
            className="flex min-h-[54px] w-full items-center justify-center rounded-[16px] bg-blue text-[15px] font-bold text-white shadow-[0_4px_8px_0_rgba(11,165,180,0.3)] transition active:scale-[0.985]"
          >
            {FLOW.booking.cta}
          </a>
          <p className="mt-2 text-center text-[12px] text-ink-mute">
            {opened ? FLOW.booking.opened : FLOW.booking.footnote}
          </p>
        </>
      }
    >
      <Alert>{FLOW.booking.alert}</Alert>

      <div className="mt-10 flex justify-center">
        <YosiLogo className="h-8 opacity-90" />
      </div>
    </Screen>
  );
}
