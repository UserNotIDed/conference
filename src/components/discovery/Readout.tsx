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
import { TONE, score } from "@/lib/score";
import { SERVICES, tierFor } from "@/lib/services";

/**
 * The readout, as two slides.
 *
 * Built to the deck Logan shared: a sentence for a headline rather than a
 * kicker and a figure, their own answers down the left so the first question
 * on a call is answered before it is asked, the components in the middle each
 * carrying where its rate came from, and the value in a dark card on the
 * right. Everything is sized in `cqw` against a 16:9 card, so the composition
 * on screen and the composition in a screenshot are identical at any width.
 *
 * Two slides rather than one because the template has room for the money and
 * nothing else, and cramming the diagnosis, what they ticked and what they
 * said into the same frame would wreck the thing that makes it work. Slide one
 * is what a rep presents. Slide two is the recap that goes in the follow-up.
 *
 * One deliberate departure from the template. Its pills read "Yosi customer
 * result"; ours cannot, because we do not have customer results, we have MGMA,
 * BLS and NIH-indexed studies. The pills name the actual source instead. Same
 * job on the slide, and it survives somebody asking which customers.
 */

type Props = {
  inputs: CalcInputs;
  practice: string;
  locations: number;
  callDate: string;
  monthlyRate: number | null;
  techStack: string[];
  intakeSatisfaction: string | null;
  onlineBooking: boolean;
  asksForReviews: boolean;
  interests: string[];
  concerns: string;
};

function useModel(p: Props) {
  const leak = calculate(p.inputs);
  const back = recovery(leak);
  const up = growth(leak, {
    onlineBooking: p.onlineBooking,
    asksForReviews: p.asksForReviews,
  });
  const health = score({
    inputs: p.inputs,
    techStack: p.techStack,
    intakeSatisfaction: p.intakeSatisfaction,
    onlineBooking: p.onlineBooking,
    asksForReviews: p.asksForReviews,
  });
  const annualCost = p.monthlyRate
    ? p.monthlyRate * p.inputs.providers * 12
    : null;
  return {
    leak,
    back,
    up,
    health,
    annualCost,
    noShow: up.opportunities.find((o) => o.key === "noshow"),
    multiple: annualCost && annualCost > 0 ? back.total / annualCost : null,
    payback: annualCost && back.total > 0 ? annualCost / (back.total / 12) : null,
    per: (annual: number) => annual / p.inputs.providers / 12,
  };
}

/** Where each component's rate comes from. Named, because "trust us" is not a source. */
const SOURCE: Record<string, string> = {
  staff: "NIH time study · BLS wage",
  admin: "NIH cost study",
  collection: "Our estimate",
  denials: "MGMA · Change Healthcare",
};

export function Readout(props: Props & { slide: 1 | 2 | 3 }) {
  if (props.slide === 2) return <WorkingSlide {...props} />;
  if (props.slide === 3) return <ConversationSlide {...props} />;
  return <ValueSlide {...props} />;
}

/* ------------------------------------------------------------------ slide 1 */

function ValueSlide(p: Props) {
  const m = useModel(p);

  // Four, not seven. The other three are in the formulas on slide two, and a
  // slide earns nothing by listing an input the audience is not going to
  // check. These are the ones that drive the figure.
  const numbers: [string, string][] = [
    ["Providers", String(p.inputs.providers)],
    ["Appointments a day", String(p.inputs.patientsPerDay)],
    ["No-show rate", pct(p.inputs.noShowRate)],
    ["Front desk", String(p.inputs.frontDeskStaff)],
  ];

  const biggest = Math.max(...m.back.lines.map((l) => l.amount), 1);

  return (
    <Slide number="01">
      <header>
        <Kicker>What it is costing you</Kicker>
        <h1 className="mt-[0.45cqw] text-[3.2cqw] font-extrabold leading-[1.06] tracking-[-0.032em] text-ink">
          This is costing <Mag>{p.practice}</Mag>{" "}
          <Mag>{usdRounded(m.leak.total)}</Mag> a year.
        </h1>
        <p className="mt-[0.5cqw] text-[1.05cqw] font-medium text-ink-sub">
          Your numbers, from {p.callDate}. Our rates, all published.
        </p>
      </header>

      <div className="mt-[1.5cqw] grid flex-1 grid-cols-[2.6fr_5fr_3.1fr] gap-[1.2cqw]">
        {/* Their answers, and what those answers score. */}
        <Panel>
          <div className="flex items-center gap-[0.8cqw]">
            <ScoreRing value={m.health.total} tone={m.health.band.tone} />
            <div className="min-w-0">
              <p className="text-[0.72cqw] font-bold uppercase tracking-[0.07em] text-ink-mute">
                Practice health
              </p>
              <p
                className="text-[1.15cqw] font-extrabold uppercase leading-[1.15] tracking-[0.04em]"
                style={{ color: TONE[m.health.band.tone].solid }}
              >
                {m.health.band.label}
              </p>
            </div>
          </div>
          <dl className="mt-[1cqw] space-y-[0.7cqw] border-t border-hairline pt-[0.9cqw]">
            {numbers.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-[0.5cqw]">
                <dt className="text-[0.95cqw] font-medium text-ink-sub">{k}</dt>
                <dd className="shrink-0 rounded-[0.45cqw] border border-magenta/45 px-[0.7cqw] py-[0.2cqw] text-[1cqw] font-extrabold tabular-nums text-magenta">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>

        {/* Four lines. The arithmetic and the sources are on slide two: a
            formula nobody can read from the back of a room is not evidence,
            it is texture. */}
        <section className="flex flex-col">
          <Kicker>Where it goes, and what comes back</Kicker>
          <div className="mt-[0.7cqw] flex flex-1 flex-col justify-between">
            {m.leak.components.map((c) => {
              const removed =
                m.back.lines.find((l) => l.key === c.key)?.amount ?? 0;
              return (
                <div key={c.key}>
                  <div className="flex items-baseline justify-between gap-[1cqw]">
                    <span className="text-[1.3cqw] font-extrabold tracking-[-0.015em] text-ink">
                      {c.label}
                    </span>
                    <span className="shrink-0 text-[1.9cqw] font-extrabold leading-none tracking-[-0.03em] text-magenta tabular-nums">
                      {usdRounded(removed)}
                    </span>
                  </div>
                  <div className="mt-[0.35cqw] h-[0.42cqw] w-full overflow-hidden rounded-full bg-hairline">
                    <div
                      className="h-full rounded-full bg-magenta"
                      style={{ width: `${(removed / biggest) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* The value, and only here the spend. */}
        <div className="flex flex-col justify-between rounded-[0.9cqw] bg-ink p-[1.3cqw]">
          <div>
            <p className="text-[0.72cqw] font-bold uppercase tracking-[0.08em] text-white/50">
              Estimated annual value
            </p>
            <p className="mt-[0.35cqw] text-[4.1cqw] font-extrabold leading-[0.86] tracking-[-0.04em] text-magenta tabular-nums">
              {usdRounded(m.back.total)}
            </p>
            <p className="mt-[0.45cqw] text-[0.95cqw] font-bold leading-[1.3] text-white">
              {usd(m.per(m.back.total))} per provider, per month
            </p>
          </div>

          {m.annualCost === null ? (
            <p className="text-[0.85cqw] leading-[1.45] text-white/50">
              Add a rate to show investment, payback and return.
            </p>
          ) : (
            <div className="space-y-[0.6cqw]">
              <DarkStat label="Investment" value={`${usd(m.annualCost)} a year`} />
              <DarkStat
                label="Payback"
                value={
                  m.payback === null
                    ? "n/a"
                    : m.payback < 1
                      ? "under a month"
                      : `${m.payback.toFixed(1)} months`
                }
              />
              <DarkStat
                label="Return"
                value={m.multiple ? `${m.multiple.toFixed(1)}x` : "n/a"}
              />
            </div>
          )}

          <p className="text-[0.72cqw] text-white/40">
            An estimator, not an audit.
          </p>
        </div>
      </div>
    </Slide>
  );
}

/* ------------------------------------------------------------------ slide 2 */

/** The working. Shown when somebody asks, not before. */
function WorkingSlide(p: Props) {
  const m = useModel(p);

  return (
    <Slide number="02">
      <header>
        <Kicker>Show the working</Kicker>
        <h1 className="mt-[0.45cqw] text-[2.6cqw] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink">
          Where the <Mag>{usdRounded(m.leak.total)}</Mag> comes from.
        </h1>
      </header>

      <div className="mt-[1.2cqw] grid flex-1 grid-cols-12 gap-[1cqw]">
        <section className="col-span-7 flex flex-col justify-between">
          {m.leak.components.map((c) => {
            const removed =
              m.back.lines.find((l) => l.key === c.key)?.amount ?? 0;
            return (
              <div
                key={c.key}
                className="rounded-[0.8cqw] border border-hairline bg-white px-[1cqw] py-[0.8cqw]"
              >
                <div className="flex items-baseline justify-between gap-[0.8cqw]">
                  <span className="text-[1.1cqw] font-extrabold text-ink">
                    {c.label}
                  </span>
                  <span className="shrink-0 text-[0.85cqw] font-medium text-ink-sub">
                    {usd(c.amount)} today,{" "}
                    <span className="font-extrabold text-magenta">
                      {usd(removed)}
                    </span>{" "}
                    back
                  </span>
                </div>
                <p className="mt-[0.2cqw] text-[0.82cqw] font-medium text-ink-mute">
                  {c.formula}
                </p>
                <span className="mt-[0.35cqw] inline-block rounded-full border border-teal/35 bg-teal-bg px-[0.6cqw] py-[0.12cqw] text-[0.68cqw] font-bold text-ink">
                  {SOURCE[c.key]}
                </span>
              </div>
            );
          })}
        </section>

        <Panel className="col-span-5 flex flex-col">
          <Kicker>Every rate, and where it came from</Kicker>
          <div className="mt-[0.6cqw] flex-1 space-y-[0.1cqw]">
            {[
              ASSUMPTIONS.avgVisitRevenue,
              ASSUMPTIONS.frontDeskHourlyRate,
              ASSUMPTIONS.minutesPerIntakeToday,
              ASSUMPTIONS.minutesSaved,
              ASSUMPTIONS.adminCostPerIntake,
              ASSUMPTIONS.denialRate,
              ASSUMPTIONS.frontEndDenialShare,
              ASSUMPTIONS.costToRework,
              ASSUMPTIONS.patientResponsibility,
              ASSUMPTIONS.writeOffRate,
            ].map((a) => (
              <div
                key={a.label}
                className="flex items-baseline justify-between gap-[0.5cqw] border-b border-hairline/70 py-[0.22cqw]"
              >
                <span className="truncate text-[0.8cqw] font-medium text-ink-sub">
                  {a.label}
                </span>
                <span className="flex shrink-0 items-baseline gap-[0.35cqw]">
                  <span className="text-[0.82cqw] font-extrabold tabular-nums text-ink">
                    {a.display}
                  </span>
                  <span
                    className={`rounded-full px-[0.4cqw] text-[0.62cqw] font-bold uppercase ${
                      a.status === "placeholder"
                        ? "bg-amber-bg text-amber-dk"
                        : "bg-canvas text-ink-mute"
                    }`}
                  >
                    {a.status === "placeholder" ? "ours" : "sourced"}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-[0.6cqw] text-[0.72cqw] leading-[1.45] text-ink-mute">
            MGMA, the BLS and NIH-indexed studies. Industry benchmarks rather
            than Yosi customer results. The two marked ours are the two we
            could not source, and they are the right ones to argue with.
          </p>
        </Panel>
      </div>
    </Slide>
  );
}

/* ------------------------------------------------------------------ slide 3 */

/** What the call actually turned up. The follow-up slide. */
function ConversationSlide(p: Props) {
  const m = useModel(p);
  const tier = tierFor(p.interests);
  const gaps = m.up.opportunities.filter((o) => o.key !== "noshow");

  return (
    <Slide number="03">
      <header>
        <Kicker>What else came out of it</Kicker>
        <h1 className="mt-[0.45cqw] text-[2.6cqw] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink">
          The part we are <Mag>not</Mag> counting.
        </h1>
      </header>

      <div className="mt-[1.2cqw] grid flex-1 grid-cols-12 gap-[1cqw]">
        <div className="col-span-6 flex flex-col justify-center rounded-[0.9cqw] bg-ink p-[1.4cqw]">
          <p className="text-[0.72cqw] font-bold uppercase tracking-[0.08em] text-white/50">
            Scheduling and reminders
          </p>
          <p className="mt-[0.3cqw] text-[3.8cqw] font-extrabold leading-[0.88] tracking-[-0.04em] text-magenta tabular-nums">
            {usdRounded(m.noShow?.amount ?? 0)}
          </p>
          <p className="mt-[0.4cqw] text-[1cqw] font-bold text-white">
            a year in appointments that never happened
          </p>
          <p className="mt-[0.25cqw] text-[0.78cqw] text-white/45">
            {m.noShow?.basis}
          </p>
          <p className="mt-[0.9cqw] border-t border-white/15 pt-[0.7cqw] text-[0.88cqw] leading-[1.5] text-white/70">
            In none of the figures on the first slide. A no-show is a
            scheduling problem rather than an intake one. We show you the cost
            and claim no share of it.
          </p>
        </div>

        <div className="col-span-6 flex flex-col gap-[1cqw]">
          <Panel>
            <div className="flex items-baseline justify-between">
              <Kicker>What you asked about</Kicker>
              {tier ? (
                <span className="rounded-full bg-blue px-[0.6cqw] py-[0.15cqw] text-[0.68cqw] font-bold text-white">
                  {tier}
                </span>
              ) : null}
            </div>
            {p.interests.length === 0 ? (
              <p className="mt-[0.5cqw] text-[0.85cqw] text-ink-pale">
                Nothing ticked.
              </p>
            ) : (
              <div className="mt-[0.5cqw] flex flex-wrap gap-[0.35cqw]">
                {SERVICES.filter((sv) => p.interests.includes(sv.id)).map(
                  (sv) => (
                    <span
                      key={sv.id}
                      className="rounded-full border border-teal/35 bg-teal-bg px-[0.65cqw] py-[0.22cqw] text-[0.82cqw] font-semibold text-ink"
                    >
                      {sv.label}
                    </span>
                  ),
                )}
              </div>
            )}
            {p.concerns.trim() ? (
              <p className="mt-[0.7cqw] border-t border-hairline pt-[0.6cqw] text-[0.92cqw] italic leading-[1.45] text-ink-sub">
                &ldquo;{p.concerns.trim()}&rdquo;
              </p>
            ) : null}
          </Panel>

          {/* The breakdown behind the wheel on slide one. It lives here
              rather than there because slide one has one job, and because
              without it this column is half empty. */}
          <Panel className="flex-1">
            <Kicker>How the score is built</Kicker>
            <div className="mt-[0.5cqw] space-y-[0.42cqw]">
              {m.health.dimensions.map((d) => (
                <div key={d.key}>
                  <div className="flex items-baseline justify-between gap-[0.4cqw]">
                    <span className="truncate text-[0.85cqw] font-semibold text-ink">
                      {d.label}
                    </span>
                    <span className="shrink-0 text-[0.85cqw] font-extrabold tabular-nums text-ink">
                      {d.value}
                      <span className="font-bold text-ink-pale"> /100</span>
                    </span>
                  </div>
                  <span className="mt-[0.18cqw] block h-[0.38cqw] overflow-hidden rounded-full bg-hairline">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${d.value}%`,
                        background:
                          TONE[
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
                </div>
              ))}
            </div>
          </Panel>

          {gaps.length > 0 ? (
            <Panel>
              <Kicker>Open goals, and neither needs us</Kicker>
              <ul className="mt-[0.45cqw] space-y-[0.3cqw]">
                {gaps.map((g) => (
                  <li
                    key={g.key}
                    className="text-[0.88cqw] font-semibold leading-[1.35] text-ink"
                  >
                    {g.label}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>
    </Slide>
  );
}

/* ------------------------------------------------------------------- shared */

function Slide({
  number,
  children,
}: {
  number: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative aspect-[16/9] w-full overflow-hidden bg-canvas"
      style={{ containerType: "inline-size" }}
    >
      <div className="flex h-full flex-col p-[2cqw] pb-[1.1cqw]">
        {children}
        <footer className="mt-[0.7cqw] flex items-center justify-between">
          <span className="text-[0.68cqw] font-bold text-ink-pale">{number}</span>
          <span className="text-[0.68cqw] font-bold uppercase tracking-[0.1em] text-ink-pale">
            Confidential · {new Date().getFullYear()}
          </span>
          <YosiLogo className="h-[1.3cqw]" />
        </footer>
      </div>
    </div>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[0.9cqw] border border-hairline bg-white p-[1cqw] ${className}`}
    >
      {children}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.72cqw] font-bold uppercase tracking-[0.1em] text-teal">
      {children}
    </p>
  );
}

function Mag({ children }: { children: React.ReactNode }) {
  return <span className="text-magenta">{children}</span>;
}

function DarkStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.68cqw] font-bold uppercase tracking-[0.06em] text-white/45">
        {label}
      </p>
      <p className="text-[1.35cqw] font-extrabold leading-tight text-magenta tabular-nums">
        {value}
      </p>
    </div>
  );
}

/**
 * The wheel, kept. In cqw with a viewBox rather than the product component,
 * which takes a pixel size: a fixed ring inside a card that scales with its
 * container overflows and sits on its own label.
 */
function ScoreRing({ value, tone }: { value: number; tone: keyof typeof TONE }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: "5.4cqw", height: "5.4cqw" }}>
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
        <span className="text-[1.6cqw] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
          {Math.round(value)}
        </span>
      </div>
    </div>
  );
}
