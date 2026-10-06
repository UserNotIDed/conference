"use client";

import { YosiLogo } from "@/components/YosiLogo";
import {
  calculate,
  growth,
  pct,
  recovery,
  usd,
  usdRounded,
  type CalcInputs,
} from "@/lib/calc";
import { score, type ScoreResult } from "@/lib/score";
import { TONE } from "@/lib/score";

/**
 * The slide.
 *
 * Every size in here is in `cqw`, one per cent of the card's own width, and
 * the card is locked to 16:9. That means the thing on screen and the thing in
 * a screenshot are the same composition at any window size, which is the only
 * way a "usable on a slide" promise survives contact with somebody's laptop.
 * Fixed pixel type would reflow and the layout a rep rehearsed with would not
 * be the layout they present.
 *
 * It is a readout, not a sales page. No CTA, no persuasion furniture, and the
 * answers it was built from are printed along the top: on a call the first
 * question is always "where did you get that", and the slide should answer it
 * without anyone going back to a previous screen.
 */
export function Readout({
  inputs,
  practice,
  monthlyRate,
  techStack,
  intakeSatisfaction,
  onlineBooking,
  asksForReviews,
}: {
  inputs: CalcInputs;
  practice: string;
  /** Per provider per month. Typed by the rep, never stored, never committed. */
  monthlyRate: number | null;
  techStack: string[];
  intakeSatisfaction: string | null;
  onlineBooking: boolean;
  asksForReviews: boolean;
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

  const per = (annual: number) => annual / inputs.providers / 12;
  const annualCost = monthlyRate ? monthlyRate * inputs.providers * 12 : null;
  const net = annualCost === null ? null : back.total - annualCost;
  const multiple = annualCost && annualCost > 0 ? back.total / annualCost : null;
  const paybackMonths =
    annualCost && back.total > 0 ? annualCost / (back.total / 12) : null;

  return (
    <div
      className="relative aspect-[16/9] w-full overflow-hidden bg-white"
      style={{ containerType: "inline-size" }}
    >
      <div className="flex h-full flex-col p-[2.6cqw]">
        <Header practice={practice} inputs={inputs} health={health} />

        <div className="mt-[1.6cqw] grid flex-1 grid-cols-[1.25fr_1fr] gap-[1.6cqw]">
          <LeftColumn leak={leak} back={back} per={per} />
          <RightColumn
            noShow={noShow?.amount ?? 0}
            noShowBasis={noShow?.basis ?? ""}
            perNoShow={per(noShow?.amount ?? 0)}
            hours={up.hoursFreed}
            gaps={up.opportunities.filter((o) => o.key !== "noshow")}
          />
        </div>

        <Footer
          annualCost={annualCost}
          monthlyRate={monthlyRate}
          providers={inputs.providers}
          net={net}
          multiple={multiple}
          paybackMonths={paybackMonths}
        />
      </div>
    </div>
  );
}

function Header({
  practice,
  inputs,
  health,
}: {
  practice: string;
  inputs: CalcInputs;
  health: ScoreResult;
}) {
  const answers = [
    `${inputs.providers} providers`,
    `${inputs.patientsPerDay}/day`,
    `${pct(inputs.noShowRate)} no-show`,
    `${inputs.frontDeskStaff} front desk`,
    `${pct(inputs.collectedRate)} collected`,
    `${inputs.newPatientsPerMonth} new/mo`,
  ];
  return (
    <header className="flex items-start justify-between gap-[2cqw] border-b border-hairline pb-[1.3cqw]">
      <div className="min-w-0">
        <p className="text-[0.85cqw] font-bold uppercase tracking-[0.1em] text-teal">
          Front desk readout
        </p>
        <h1 className="mt-[0.3cqw] truncate text-[2.5cqw] font-extrabold leading-[1.1] tracking-[-0.025em] text-ink">
          {practice}
        </h1>
        {/* The answers it was built from, on the slide. On a call the first
            question is always where the numbers came from. */}
        <div className="mt-[0.7cqw] flex flex-wrap gap-[0.45cqw]">
          {answers.map((a) => (
            <span
              key={a}
              className="rounded-full bg-canvas px-[0.75cqw] py-[0.25cqw] text-[0.85cqw] font-semibold text-ink-sub"
            >
              {a}
            </span>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-start gap-[1.4cqw]">
        <div className="text-right">
          <p className="text-[0.8cqw] font-bold uppercase tracking-[0.08em] text-ink-mute">
            Practice health
          </p>
          <p
            className="text-[2.6cqw] font-extrabold leading-none tabular-nums"
            style={{ color: TONE[health.band.tone].solid }}
          >
            {health.total}
          </p>
          <p
            className="text-[0.8cqw] font-bold uppercase tracking-[0.06em]"
            style={{ color: TONE[health.band.tone].solid }}
          >
            {health.band.label}
          </p>
        </div>
        <YosiLogo className="h-[2.2cqw]" />
      </div>
    </header>
  );
}

function LeftColumn({
  leak,
  back,
  per,
}: {
  leak: ReturnType<typeof calculate>;
  back: ReturnType<typeof recovery>;
  per: (n: number) => number;
}) {
  const byKey = Object.fromEntries(back.lines.map((l) => [l.key, l.amount]));
  return (
    <section className="flex flex-col">
      <div className="grid grid-cols-2 gap-[1cqw]">
        <Hero
          label="Costing them a year"
          value={usdRounded(leak.total)}
          sub={`${usd(per(leak.total))} per provider per month`}
        />
        <Hero
          label="We take off"
          value={usdRounded(back.total)}
          sub={`${usd(per(back.total))} per provider per month`}
          accent
        />
      </div>

      <table className="mt-[1.2cqw] w-full border-collapse">
        <thead>
          <tr className="border-b border-hairline">
            <Th>Where it goes</Th>
            <Th right>Today</Th>
            <Th right accent>
              We remove
            </Th>
          </tr>
        </thead>
        <tbody>
          {leak.components.map((c) => (
            <tr key={c.key} className="border-b border-hairline/60">
              <td className="py-[0.5cqw] pr-[0.6cqw] text-[1.05cqw] font-semibold leading-[1.25] text-ink">
                {c.label}
                <span className="block text-[0.8cqw] font-medium text-ink-mute">
                  {c.formula}
                </span>
              </td>
              <td className="py-[0.5cqw] text-right text-[1.1cqw] font-medium tabular-nums text-ink-sub">
                {usd(c.amount)}
              </td>
              <td className="py-[0.5cqw] pl-[0.6cqw] text-right text-[1.1cqw] font-extrabold tabular-nums text-teal">
                {usd(byKey[c.key] ?? 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function RightColumn({
  noShow,
  noShowBasis,
  perNoShow,
  hours,
  gaps,
}: {
  noShow: number;
  noShowBasis: string;
  perNoShow: number;
  hours: number;
  gaps: { key: string; label: string }[];
}) {
  return (
    <section className="flex flex-col gap-[1cqw]">
      <div className="rounded-[1.1cqw] bg-ink p-[1.3cqw]">
        <p className="text-[0.8cqw] font-bold uppercase tracking-[0.07em] text-white/55">
          Separate opportunity · scheduling and reminders
        </p>
        <p className="mt-[0.4cqw] text-[2.9cqw] font-extrabold leading-none tracking-[-0.03em] text-white tabular-nums">
          {usdRounded(noShow)}
        </p>
        <p className="mt-[0.35cqw] text-[1cqw] font-bold text-white/85">
          {usd(perNoShow)} per provider per month
        </p>
        <p className="mt-[0.3cqw] text-[0.8cqw] font-medium text-white/45">
          {noShowBasis}
        </p>
        <p className="mt-[0.7cqw] border-t border-white/15 pt-[0.6cqw] text-[0.9cqw] leading-[1.45] text-white/75">
          Not in the figures on the left. Reminders, confirmations, two-way
          messaging and self-scheduling are what move a no-show rate.
        </p>
      </div>

      <div className="rounded-[1.1cqw] border border-hairline bg-canvas p-[1.3cqw]">
        <p className="text-[0.8cqw] font-bold uppercase tracking-[0.07em] text-ink-mute">
          Front desk time returned
        </p>
        <p className="mt-[0.3cqw] text-[2cqw] font-extrabold leading-none tracking-[-0.02em] text-ink tabular-nums">
          {Math.round(hours).toLocaleString("en-US")} hrs
        </p>
        <p className="mt-[0.25cqw] text-[0.9cqw] font-medium text-ink-sub">
          a year, across the practice
        </p>
      </div>

      {gaps.length > 0 ? (
        <div className="rounded-[1.1cqw] border border-amber-line bg-amber-bg p-[1.3cqw]">
          <p className="text-[0.8cqw] font-bold uppercase tracking-[0.07em] text-amber-dk">
            Open goals
          </p>
          <ul className="mt-[0.4cqw] space-y-[0.25cqw]">
            {gaps.map((g) => (
              <li
                key={g.key}
                className="text-[0.95cqw] font-semibold leading-[1.35] text-ink"
              >
                {g.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function Footer({
  annualCost,
  monthlyRate,
  providers,
  net,
  multiple,
  paybackMonths,
}: {
  annualCost: number | null;
  monthlyRate: number | null;
  providers: number;
  net: number | null;
  multiple: number | null;
  paybackMonths: number | null;
}) {
  if (annualCost === null) {
    return (
      <p className="mt-[1.2cqw] border-t border-hairline pt-[0.8cqw] text-[0.8cqw] leading-[1.5] text-ink-mute">
        An estimator, not an audit. Industry benchmarks rather than Yosi
        customer results; what a practice actually sees depends on payer mix,
        schedule and how the desk runs today. Add a rate in the panel to put
        return and payback on the slide.
      </p>
    );
  }
  return (
    <div className="mt-[1.2cqw] grid grid-cols-[auto_1fr] items-center gap-[1.4cqw] border-t border-hairline pt-[0.9cqw]">
      <div className="flex gap-[1.6cqw]">
        <Figure label={`Yosi at $${monthlyRate}/provider/mo`} value={usd(annualCost)} />
        <Figure label="Net a year" value={usd(net ?? 0)} accent />
        <Figure
          label="Return on spend"
          value={multiple ? `${multiple.toFixed(1)}x` : "n/a"}
        />
        <Figure
          label="Payback"
          value={
            paybackMonths === null
              ? "n/a"
              : paybackMonths < 1
                ? "under a month"
                : `${paybackMonths.toFixed(1)} months`
          }
        />
      </div>
      <p className="text-right text-[0.75cqw] leading-[1.45] text-ink-mute">
        {providers} providers. Estimator, not an audit. Industry benchmarks,
        not Yosi customer results.
      </p>
    </div>
  );
}

function Figure({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-[0.75cqw] font-bold uppercase tracking-[0.06em] text-ink-mute">
        {label}
      </p>
      <p
        className={`text-[1.5cqw] font-extrabold leading-tight tabular-nums ${
          accent ? "text-teal" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Hero({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.1cqw] border p-[1.2cqw] ${
        accent ? "border-teal/30 bg-teal-bg" : "border-hairline bg-white"
      }`}
    >
      <p className="text-[0.8cqw] font-bold uppercase tracking-[0.07em] text-ink-mute">
        {label}
      </p>
      <p className="mt-[0.3cqw] text-[3cqw] font-extrabold leading-none tracking-[-0.035em] text-ink tabular-nums">
        {value}
      </p>
      <p className="mt-[0.35cqw] text-[0.9cqw] font-semibold text-ink-sub">
        {sub}
      </p>
    </div>
  );
}

function Th({
  children,
  right,
  accent,
}: {
  children: React.ReactNode;
  right?: boolean;
  accent?: boolean;
}) {
  return (
    <th
      className={`pb-[0.4cqw] text-[0.75cqw] font-bold uppercase tracking-[0.06em] ${
        right ? "text-right" : "text-left"
      } ${accent ? "text-teal" : "text-ink-mute"}`}
    >
      {children}
    </th>
  );
}
