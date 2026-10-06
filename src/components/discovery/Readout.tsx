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

export function Readout(props: Props & { slide: 1 | 2 }) {
  return props.slide === 1 ? <ValueSlide {...props} /> : <RecapSlide {...props} />;
}

/* ------------------------------------------------------------------ slide 1 */

function ValueSlide(p: Props) {
  const m = useModel(p);

  const numbers: [string, string][] = [
    ["Providers", String(p.inputs.providers)],
    ["Locations", String(p.locations)],
    ["Appointments per day", String(p.inputs.patientsPerDay)],
    ["No-show rate", pct(p.inputs.noShowRate)],
    ["Front desk headcount", String(p.inputs.frontDeskStaff)],
    ["Balances collected up front", pct(p.inputs.collectedRate)],
    ["New patients a month", String(p.inputs.newPatientsPerMonth)],
  ];

  return (
    <Slide number="01">
      <header>
        <Kicker>What it is costing you</Kicker>
        <h1 className="mt-[0.4cqw] text-[2.9cqw] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink">
          This is costing <Mag>{p.practice}</Mag>{" "}
          <Mag>{usdRounded(m.leak.total)}</Mag> a year.
        </h1>
        <p className="mt-[0.45cqw] text-[1cqw] font-medium leading-[1.4] text-ink-sub">
          Built from the numbers you shared on{" "}
          <span className="font-bold text-ink">{p.callDate}</span>. The inputs
          are yours. The rates are published benchmarks, and every one of them
          is named.
        </p>
      </header>

      <div className="mt-[1.1cqw] grid flex-1 grid-cols-[3.1fr_5fr_3.2fr] gap-[1cqw]">
        {/* Their answers, and what those answers score. */}
        <Panel>
          <Kicker>Your numbers</Kicker>
          <div className="mt-[0.7cqw] flex items-center gap-[0.8cqw] border-b border-hairline pb-[0.7cqw]">
            <ScoreRing value={m.health.total} tone={m.health.band.tone} />
            <div className="min-w-0">
              <p className="text-[0.7cqw] font-bold uppercase tracking-[0.06em] text-ink-mute">
                Practice health
              </p>
              <p
                className="text-[1.05cqw] font-extrabold uppercase leading-[1.2] tracking-[0.04em]"
                style={{ color: TONE[m.health.band.tone].solid }}
              >
                {m.health.band.label}
              </p>
              <p className="mt-[0.15cqw] text-[0.72cqw] leading-[1.3] text-ink-sub">
                Most to gain: {biggestGap(m.health).label.toLowerCase()}
              </p>
            </div>
          </div>
          <dl className="mt-[0.55cqw] space-y-[0.35cqw]">
            {numbers.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-[0.5cqw]">
                <dt className="text-[0.82cqw] font-medium leading-[1.25] text-ink-sub">
                  {k}
                </dt>
                <dd className="shrink-0 rounded-[0.45cqw] border border-magenta/45 px-[0.65cqw] py-[0.15cqw] text-[0.88cqw] font-extrabold tabular-nums text-magenta">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-[0.55cqw] text-[0.68cqw] text-ink-pale">
            From the pre-call diagnostic
          </p>
        </Panel>

        {/* Each component: what it costs now, what comes off, where the rate
            came from. */}
        <section className="flex flex-col">
          <Kicker>Where the money goes</Kicker>
          <div className="mt-[0.5cqw] flex flex-1 flex-col gap-[0.5cqw]">
            {m.leak.components.map((c) => {
              const removed =
                m.back.lines.find((l) => l.key === c.key)?.amount ?? 0;
              return (
                <div
                  key={c.key}
                  className="flex flex-1 items-center justify-between gap-[0.8cqw] rounded-[0.8cqw] border border-hairline bg-white px-[1cqw]"
                >
                  <div className="min-w-0">
                    <p className="text-[1.05cqw] font-extrabold leading-[1.2] tracking-[-0.01em] text-ink">
                      {c.label}
                    </p>
                    <p className="mt-[0.15cqw] text-[0.72cqw] font-medium leading-[1.3] text-ink-mute">
                      {c.formula}
                    </p>
                    <span className="mt-[0.3cqw] inline-block rounded-full border border-teal/35 bg-teal-bg px-[0.55cqw] py-[0.1cqw] text-[0.65cqw] font-bold text-ink">
                      {SOURCE[c.key]}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[1.75cqw] font-extrabold leading-none tracking-[-0.03em] text-magenta tabular-nums">
                      {usdRounded(removed)}
                    </p>
                    <p className="text-[0.65cqw] font-semibold text-ink-mute">
                      a year back
                    </p>
                    <p className="mt-[0.1cqw] text-[0.65cqw] text-ink-pale">
                      of {usd(c.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* The value, and only here the spend. */}
        <div className="flex flex-col justify-between rounded-[0.9cqw] bg-ink p-[1.1cqw]">
          <div>
            <p className="text-[0.7cqw] font-bold uppercase tracking-[0.08em] text-white/50">
              Estimated annual value
            </p>
            <p className="mt-[0.3cqw] text-[3.7cqw] font-extrabold leading-[0.88] tracking-[-0.04em] text-magenta tabular-nums">
              {usdRounded(m.back.total)}
            </p>
            <p className="mt-[0.35cqw] text-[0.85cqw] font-medium leading-[1.35] text-white/70">
              returned to {p.practice} each year, or{" "}
              <span className="font-bold text-white">
                {usd(m.per(m.back.total))}
              </span>{" "}
              per provider per month
            </p>
          </div>

          <div className="space-y-[0.5cqw]">
            {m.annualCost === null ? (
              <p className="text-[0.8cqw] leading-[1.45] text-white/55">
                Add a rate in the panel to put investment, payback and return
                on the slide.
              </p>
            ) : (
              <>
                <DarkStat label="Yosi investment" value={`${usd(m.annualCost)} a year`} />
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
              </>
            )}
          </div>

          <p className="border-t border-white/15 pt-[0.5cqw] text-[0.68cqw] leading-[1.45] text-white/45">
            Conservative by design. No-shows are costed on the next slide and
            claimed from nowhere. An estimator, not an audit.
          </p>
        </div>
      </div>
    </Slide>
  );
}

/* ------------------------------------------------------------------ slide 2 */

function RecapSlide(p: Props) {
  const m = useModel(p);
  const tier = tierFor(p.interests);
  const gaps = m.up.opportunities.filter((o) => o.key !== "noshow");

  return (
    <Slide number="02">
      <header>
        <Kicker>What else came out of it</Kicker>
        <h1 className="mt-[0.4cqw] text-[2.3cqw] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink">
          The parts we are <Mag>not</Mag> counting, and what you asked for.
        </h1>
      </header>

      <div className="mt-[1cqw] grid flex-1 grid-cols-12 grid-rows-2 gap-[0.9cqw]">
        <div className="col-span-5 row-span-1 flex flex-col justify-center rounded-[0.9cqw] bg-ink p-[1.1cqw]">
          <p className="text-[0.7cqw] font-bold uppercase tracking-[0.08em] text-white/50">
            Separate opportunity · scheduling and reminders
          </p>
          <p className="mt-[0.2cqw] text-[3cqw] font-extrabold leading-none tracking-[-0.035em] text-magenta tabular-nums">
            {usdRounded(m.noShow?.amount ?? 0)}
          </p>
          <p className="mt-[0.25cqw] text-[0.85cqw] font-bold text-white">
            {usd(m.per(m.noShow?.amount ?? 0))} per provider per month ·{" "}
            {m.noShow?.basis}
          </p>
          <p className="mt-[0.4cqw] text-[0.8cqw] leading-[1.45] text-white/65">
            Not in any figure on the previous slide. A no-show is a scheduling
            problem rather than an intake one: reminders, confirmations,
            two-way messaging and self-scheduling move it. We show the cost and
            claim no share of it.
          </p>
        </div>

        <Panel className="col-span-4">
          <Kicker>How the score is built</Kicker>
          <div className="mt-[0.5cqw] space-y-[0.4cqw]">
            {m.health.dimensions.map((d) => (
              <div key={d.key}>
                <div className="flex items-baseline justify-between gap-[0.4cqw]">
                  <span className="truncate text-[0.8cqw] font-semibold text-ink">
                    {d.label}
                  </span>
                  <span className="shrink-0 text-[0.8cqw] font-extrabold tabular-nums text-ink">
                    {d.value}
                    <span className="font-bold text-ink-pale"> /100</span>
                  </span>
                </div>
                <span className="mt-[0.15cqw] block h-[0.4cqw] overflow-hidden rounded-full bg-hairline">
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
                <span className="mt-[0.1cqw] block text-[0.66cqw] text-ink-mute">
                  {d.detail}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="col-span-3">
          <Kicker>Open goals</Kicker>
          {gaps.length === 0 ? (
            <p className="mt-[0.4cqw] text-[0.8cqw] leading-[1.4] text-ink-sub">
              None. You already ask for reviews and already take bookings
              online, which is rarer than you would think.
            </p>
          ) : (
            <ul className="mt-[0.4cqw] space-y-[0.35cqw]">
              {gaps.map((g) => (
                <li
                  key={g.key}
                  className="rounded-[0.5cqw] border border-amber-line bg-amber-bg px-[0.6cqw] py-[0.35cqw] text-[0.78cqw] font-semibold leading-[1.3] text-ink"
                >
                  {g.label}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-[0.5cqw] text-[0.68cqw] leading-[1.4] text-ink-mute">
            Neither is priced. Both are things you could switch on without us.
          </p>
        </Panel>

        <Panel className="col-span-5">
          <div className="flex items-baseline justify-between">
            <Kicker>What you asked about</Kicker>
            {tier ? (
              <span className="rounded-full bg-blue px-[0.6cqw] py-[0.15cqw] text-[0.68cqw] font-bold text-white">
                {tier}
              </span>
            ) : null}
          </div>
          {p.interests.length === 0 ? (
            <p className="mt-[0.4cqw] text-[0.8cqw] text-ink-pale">
              Nothing ticked yet.
            </p>
          ) : (
            <div className="mt-[0.4cqw] flex flex-wrap gap-[0.3cqw]">
              {SERVICES.filter((s) => p.interests.includes(s.id)).map((s) => (
                <span
                  key={s.id}
                  className="rounded-full border border-teal/35 bg-teal-bg px-[0.55cqw] py-[0.18cqw] text-[0.72cqw] font-semibold text-ink"
                >
                  {s.label}
                </span>
              ))}
            </div>
          )}
          {p.concerns.trim() ? (
            <div className="mt-[0.6cqw] border-t border-hairline pt-[0.45cqw]">
              <Kicker>Also on your mind</Kicker>
              <p className="mt-[0.2cqw] text-[0.82cqw] italic leading-[1.4] text-ink-sub">
                &ldquo;{p.concerns.trim()}&rdquo;
              </p>
            </div>
          ) : null}
        </Panel>

        <Panel className="col-span-7">
          <Kicker>Where every rate comes from</Kicker>
          <div className="mt-[0.4cqw] grid grid-cols-2 gap-x-[0.9cqw] gap-y-[0.2cqw]">
            {[
              ASSUMPTIONS.avgVisitRevenue,
              ASSUMPTIONS.frontDeskHourlyRate,
              ASSUMPTIONS.minutesPerIntakeToday,
              ASSUMPTIONS.adminCostPerIntake,
              ASSUMPTIONS.denialRate,
              ASSUMPTIONS.frontEndDenialShare,
              ASSUMPTIONS.costToRework,
              ASSUMPTIONS.patientResponsibility,
            ].map((a) => (
              <div
                key={a.label}
                className="flex items-baseline justify-between gap-[0.4cqw] border-b border-hairline/70 py-[0.15cqw]"
              >
                <span className="truncate text-[0.72cqw] font-medium text-ink-sub">
                  {a.label}
                </span>
                <span className="flex shrink-0 items-baseline gap-[0.3cqw]">
                  <span className="text-[0.72cqw] font-extrabold tabular-nums text-ink">
                    {a.display}
                  </span>
                  <span
                    className={`rounded-full px-[0.35cqw] text-[0.58cqw] font-bold uppercase ${
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
          <p className="mt-[0.4cqw] text-[0.66cqw] leading-[1.4] text-ink-mute">
            MGMA, the BLS and NIH-indexed studies. Industry benchmarks rather
            than Yosi customer results, and the two marked ours are the two we
            could not source. An estimator, not an audit: payer mix, schedule
            and how the desk runs today all move these.
          </p>
        </Panel>
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
