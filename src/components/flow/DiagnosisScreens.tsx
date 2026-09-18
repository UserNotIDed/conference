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
  growth,
  orderComponents,
  pct,
  recovery,
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
        intakeSatisfaction: session.intakeSatisfaction,
        onlineBooking: session.onlineBooking,
        asksForReviews: session.asksForReviews,
      }),
    [
      inputs,
      session.techStack,
      session.intakeSatisfaction,
      session.onlineBooking,
      session.asksForReviews,
    ],
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
              })}{" "}
              {/* The same figure as the wheel, so the same colour as the wheel.
                  Two readings of one number in two colours reads as two
                  numbers. */}
              <span
                className="tabular-nums"
                style={{ color: TONE[result.band.tone].solid }}
              >
                {result.total}
              </span>
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

/**
 * The money, as an executive summary with the working folded away.
 *
 * It leads with what Yosi puts back rather than with the leak, which is a
 * reversal and a deliberate one. The leak is dominated by no-shows, roughly
 * three quarters of it, and no-shows are the component we claim least of. So
 * leading with the leak meant leading with a number of which we recover about
 * a third, and anyone who did that division found it out for themselves.
 * Better to say it first: here is what we put back, here is the whole problem
 * it comes out of, and here is why the two differ.
 *
 * It used to be every figure at once: five leak components, five recovery
 * lines, the gaps and the assumptions, all open. Perhaps two thousand pixels
 * of arithmetic with the headline at the top of it, which is the wrong shape
 * for a screen somebody reads standing up, holding a phone, mid-conversation.
 * The detail was not wrong, it was just in front of the point.
 *
 * So: the number, what it means, and what to do about it, all above the fold.
 * Everything that justifies it is one tap away and closed by default. The
 * people who want the arithmetic are the people who will open it, and they are
 * also the people worth having the argument with.
 */
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
  const back = useMemo(() => recovery(result), [result]);
  const upside = useMemo(
    () =>
      growth(result, {
        onlineBooking: session.onlineBooking,
        asksForReviews: session.asksForReviews,
      }),
    [result, session.onlineBooking, session.asksForReviews],
  );
  const ordered = orderComponents(result, session.role);
  const lead = roleLead(result, session.role);
  // Pre-checked: they have just been shown a number, and "how do I compare" is
  // the question they are already asking. Opting out is one tap.
  const [optIn, setOptIn] = useState(session.capture.optIn ?? true);

  // A default nobody taps is still a choice, and it has to reach the record,
  // otherwise every pre-ticked box reads as declined in the export. Written
  // once on mount, and only when they have not already answered.
  useEffect(() => {
    if (session.capture.optIn === null || session.capture.optIn === undefined) {
      onBenchmark(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const M = FLOW.money;

  // Per provider per month, because that is the unit a practice is bought in.
  // Nobody approves an annual number; they approve a monthly one per provider,
  // and the decision gets made in that frame whatever we put on the screen.
  // The practice-wide annual figures are right underneath, because the monthly
  // one on its own is small enough to shrug at.
  const per = (annual: number) => annual / inputs.providers / 12;
  const costPm = per(result.total);
  const backPm = per(back.total);
  const shownPm = useCountUp(backPm, 900);

  const noShow = upside.opportunities.find((o) => o.key === "noshow");
  const gaps = upside.opportunities.filter((o) => o.key !== "noshow");
  const hoursPm = upside.hoursFreed / inputs.providers / 12;

  return (
    <Screen footer={<Button onClick={onNext}>{M.cta}</Button>}>
      <div className="animate-fade-up pt-6">
        {/* ---- The lede, in the unit they buy in. ---- */}
        <CapLabel>{M.kicker}</CapLabel>
        <div className="mt-1.5 flex items-end gap-2">
          <p className="text-[52px] font-extrabold leading-[0.88] tracking-[-0.04em] text-ink tabular-nums">
            {usd(shownPm)}
          </p>
          <p className="pb-1.5 text-[16px] font-bold text-ink-sub">
            {M.backSuffix}
          </p>
        </div>
        <p className="mt-2.5 text-[14px] font-medium leading-[1.45] text-ink-sub">
          {fill(M.headlineSub, {
            cost: usd(costPm),
            n: inputs.providers,
            back: usd(backPm),
          })}
        </p>

        {/* ---- The same money at practice scale, so the monthly figure is
               not mistaken for the size of the problem. ---- */}
        <div className="mt-4 rounded-[14px] border border-teal/25 bg-teal-bg px-4 py-3">
          <CapLabel>{M.totalLabel}</CapLabel>
          <p className="mt-1 text-[20px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink tabular-nums">
            {fill(M.totalBack, { amount: usdRounded(back.total) })}
          </p>
          <p className="mt-0.5 text-[13px] font-medium text-ink-sub">
            {fill(M.totalCost, { amount: usdRounded(result.total) })}
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <MoneyRow label={M.rowCost} value={usd(costPm)} />
          <MoneyRow label={M.rowBack} value={usd(backPm)} accent />
        </div>

        {/* ---- The second act. Bigger than everything above it and a
               different product, so it gets a different register rather than
               a footnote. ---- */}
        {noShow ? (
          <div className="mt-5 overflow-hidden rounded-[18px] bg-ink">
            <div className="p-5">
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-white/55">
                {M.noShowKicker}
              </span>
              <div className="mt-2 flex items-end gap-2">
                <p className="text-[38px] font-extrabold leading-[0.9] tracking-[-0.035em] text-white tabular-nums">
                  {usd(per(noShow.amount ?? 0))}
                </p>
                <p className="pb-1 text-[12px] font-bold leading-[1.3] text-white/60">
                  {M.noShowUnit}
                </p>
              </div>
              <p className="mt-2 text-[14px] font-bold leading-[1.3] text-white">
                {fill(M.noShowAnnual, {
                  annual: usdRounded(noShow.amount ?? 0),
                })}
              </p>
              <p className="mt-1 text-[11.5px] font-medium leading-[1.4] text-white/50">
                {noShow.basis}
              </p>

              <p className="mt-3.5 text-[13px] leading-[1.55] text-white/80">
                {M.noShowLead}
              </p>
              <ul className="mt-3 space-y-2">
                {M.noShowFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="mt-[3px] flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full bg-teal text-white">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    <span className="text-[13px] font-semibold leading-[1.4] text-white">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3.5 border-t border-white/15 pt-3 text-[12px] leading-[1.5] text-white/55">
                {M.noShowFoot}
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-3 rounded-[14px] border border-hairline bg-canvas p-4">
          <CapLabel>{M.hoursLabel}</CapLabel>
          <p className="mt-1.5 text-[13px] font-medium leading-[1.5] text-ink-sub">
            {fill(M.hoursBody, {
              hours: hoursPm.toFixed(1),
              total: Math.round(upside.hoursFreed).toLocaleString("en-US"),
            })}
          </p>
        </div>

        <p className="mt-4 text-[12.5px] font-medium leading-[1.5] text-ink-mute">
          {M.estimator}
        </p>

        {/* ---- Everything that justifies it, closed. ---- */}
        <div className="mt-5 space-y-2">
          <Disclosure
            title={fill(M.detailRecovery, { amount: usdRounded(back.total) })}
            summary={M.detailRecoverySummary}
          >
            <div className="space-y-2 pt-1">
              {back.lines.map((l) => (
                <div
                  key={l.key}
                  className="flex items-baseline justify-between gap-3"
                >
                  <span className="text-[12.5px] font-medium text-ink-sub">
                    {l.label} <span className="text-ink-pale">({l.basis})</span>
                  </span>
                  <span className="shrink-0 text-[13px] font-bold tabular-nums text-ink">
                    {usd(l.amount)}
                  </span>
                </div>
              ))}
              <p className="border-t border-hairline pt-2 text-[12px] leading-[1.5] text-ink-mute">
                {M.recoverySub}
              </p>
            </div>
          </Disclosure>

          <Disclosure
            title={fill(M.detailLeak, { amount: usdRounded(result.total) })}
            summary={fill(M.detailLeakSummary, { n: ordered.length })}
          >
            <div className="space-y-2.5 pt-1">
              {lead ? (
                <p className="pb-1 text-[12.5px] font-medium leading-[1.5] text-ink-sub">
                  {lead}
                </p>
              ) : null}
              {ordered.map((c) => (
                <div key={c.key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13.5px] font-semibold text-ink">
                      {c.label}
                    </span>
                    <span className="shrink-0 text-[14px] font-extrabold tabular-nums text-ink">
                      {usd(c.amount)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] font-medium leading-[1.4] text-ink-mute">
                    {c.formula}
                  </p>
                </div>
              ))}
            </div>
          </Disclosure>

          {gaps.length === 0 ? null : (
            <Disclosure
              title={M.gapsLabel}
              summary={fill(M.gapsSummary, { n: gaps.length })}
            >
              <div className="space-y-2.5 pt-1">
                {gaps.map((o) => (
                  <div key={o.key}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[13.5px] font-semibold text-ink">
                        {o.label}
                      </p>
                      {/* A figure where we have one that is pure arithmetic on
                          their own answers, and none where we would have had
                          to guess at a rate. */}
                      {o.amount ? (
                        <p className="shrink-0 text-[15px] font-extrabold tabular-nums text-ink">
                          {usd(o.amount)}
                        </p>
                      ) : null}
                    </div>
                    {o.basis ? (
                      <p className="mt-0.5 text-[11.5px] font-medium leading-[1.4] text-ink-mute">
                        {o.basis}
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-[12.5px] leading-[1.45] text-ink-sub">
                      {o.note}
                    </p>
                  </div>
                ))}
              </div>
            </Disclosure>
          )}

          <Disclosure title={M.showWork} summary={M.showWorkSummary}>
            <div className="space-y-3 pt-1">
              <p className="text-[12.5px] leading-[1.5] text-ink-sub">
                {M.estimatorLong}
              </p>
              <p className="text-[12.5px] leading-[1.5] text-ink-sub">
                {M.assumptionsIntro}
              </p>
              {allConstants().map((a) => (
                <div key={a.label} className="border-t border-hairline pt-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] font-semibold text-ink">
                      {a.label}
                    </span>
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
                    {a.status === "placeholder"
                      ? M.placeholderTag
                      : M.sourcedTag}
                  </span>
                  <p className="mt-1.5 text-[12px] leading-[1.45] text-ink-mute">
                    {a.source}
                  </p>
                </div>
              ))}
              <p className="border-t border-hairline pt-3 text-[12px] leading-[1.5] text-ink-mute">
                Based on {inputs.patientsPerDay} patients a day,{" "}
                {pct(inputs.noShowRate)} no-show, {inputs.frontDeskStaff} at the
                front desk, {pct(inputs.collectedRate)} collected up front and{" "}
                {inputs.newPatientsPerMonth} new patients a month.
              </p>
            </div>
          </Disclosure>
        </div>

        <div className="mt-5 rounded-[14px] border border-hairline bg-white p-4">
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

/** One line of the comparison. The accented one is the claim. */
function MoneyRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 rounded-[14px] border px-4 py-3.5 ${
        accent ? "border-teal/30 bg-teal-bg" : "border-hairline bg-white"
      }`}
    >
      <span className="text-[13.5px] font-semibold text-ink">{label}</span>
      <span
        className={`shrink-0 tabular-nums text-ink ${
          accent ? "text-[22px] font-extrabold" : "text-[17px] font-bold"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * A closed row that says what is inside it.
 *
 * The summary line matters as much as the title: a row reading only "Where it
 * comes from" is a guess, and nobody taps a guess in a loud room. A row that
 * already tells you it is five components is a decision.
 */
function Disclosure({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-[14px] border border-hairline bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:scale-[0.995]"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold text-ink">{title}</span>
          <span className="mt-0.5 block text-[12px] font-medium leading-[1.35] text-ink-mute">
            {summary}
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 text-ink-pale transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <div className="animate-fade-up border-t border-hairline px-4 pb-4 pt-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------- */

export function ScreenThanks({
  session,
  recovered,
  onBooked,
}: {
  session: ClientSession;
  /**
   * Passed in rather than read off the session: the page was server-rendered
   * before the calculator ran, so the snapshot has no result and the headline
   * would fall back to the generic line, losing the one number that makes
   * this screen a close rather than a thank-you.
   */
  recovered: number | null;
  onBooked: () => void;
}) {
  const [opened, setOpened] = useState(Boolean(session.capture.bookedAt));

  return (
    <Screen
      kicker={FLOW.booking.kicker}
      title={
        recovered
          ? fill(FLOW.booking.title, { amount: usdRounded(recovered) })
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
