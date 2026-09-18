/**
 * Generates CRITERIA.md, the one-page sheet sales and marketing mark up.
 *
 * Written by a script rather than by hand for one reason: a validation
 * document that drifts from the code is worse than none, because someone signs
 * off on a number the app is not using. Change a constant in calc.ts or a
 * weight in score.ts, run `npm run criteria`, and the sheet is true again.
 *
 *   npm run criteria
 */

import { writeFileSync } from "node:fs";
import {
  ASSUMPTIONS,
  GROWTH,
  RECOVERY,
  calculate,
  growth,
  recovery,
  usd,
  type CalcInputs,
} from "../src/lib/calc";
import {
  BANDS,
  INTAKE_POSTURE,
  SATISFACTION_PENALTY,
  SCORE_BANDS,
  TONE,
  WEIGHTS,
  score,
} from "../src/lib/score";

type Row = {
  value: number;
  label: string;
  display: string;
  status: "sourced" | "placeholder";
  source: string;
  internal?: string;
};

/** Nothing to chase: the constant is already sourced. */
const NONE = "already sourced";

const OWNER = {
  avgVisitRevenue: NONE,
  minutesPerIntakeToday: NONE,
  minutesSaved: NONE,
  staffHoursSavedPerFteWeek: NONE,
  frontDeskHourlyRate: NONE,
  denialRate: NONE,
  frontEndDenialShare: NONE,
  adminCostPerIntake: NONE,
  patientResponsibility: "RCM",
  writeOffRate: "RCM",
  costToRework: NONE,
  workingDays: NONE,
  missed: "Customer success",
  denials: NONE,
  admin: NONE,
  staff: NONE,
  collection: "Customer success",
  staffHoursNote: NONE,
  reviewUplift: "Marketing",
  bookingUplift: "Customer success",
} as const;

function table(title: string, rows: Record<string, Row>, blurb: string): string {
  const lines = [
    `### ${title}`,
    "",
    blurb,
    "",
    "| Constant | Value | Status | Owner | What it needs |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const [key, r] of Object.entries(rows)) {
    const owner = OWNER[key as keyof typeof OWNER] ?? NONE;
    const need =
      r.status === "placeholder"
        ? (r.internal ?? "Needs a source.")
        : "Signed off.";
    lines.push(
      `| **${r.label}** | \`${r.display}\` | ${r.status === "placeholder" ? "⚠️ **Ours**" : "Sourced"} | ${owner} | ${need} |`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

/** A worked example so nobody has to imagine what the formulas produce. */
const EXAMPLE: CalcInputs = {
  patientsPerDay: 45,
  noShowRate: 0.14,
  frontDeskStaff: 3,
  collectedRate: 0.5,
  newPatientsPerMonth: 35,
};

function worked(): string {
  const r = calculate(EXAMPLE);
  const back = recovery(r);
  const up = growth(r, {});
  const s = score({
    inputs: EXAMPLE,
    techStack: ["athenahealth", "Phreesia"],
    intakeSatisfaction: "It frustrates us",
  });

  const lines = [
    "A practice seeing **45 patients a day**, **14% no-show**, **3 on the front desk**,",
    "**50%** of patient balance collected up front,",
    "already running athenahealth and an intake vendor they are unhappy with.",
    "",
    `**Practice health score: ${s.total}, ${s.band.label}**`,
    "",
    "| Dimension | Score | Weight | Contribution |",
    "| --- | --- | --- | --- |",
    ...s.dimensions.map(
      (d) =>
        `| ${d.label} | ${d.value} | ${d.weight}% | ${((d.value * d.weight) / 100).toFixed(1)} |`,
    ),
    "",
    `**Annual leak: ${usd(r.total)}**`,
    "",
    "| Component | Amount | Formula |",
    "| --- | --- | --- |",
    ...r.components.map((c) => `| ${c.label} | ${usd(c.amount)} | ${c.formula} |`),
    "",
    `**What Yosi puts back: ${usd(back.total)}**, which is what the screen leads with.`,
    `That is ${Math.round((back.total / r.total) * 100)}% of the leak, and every line in it is benchmarked.`,
    "",
    `**Shown separately, and claimed from not at all: ${usd(up.opportunities.find((o) => o.key === "noshow")?.amount ?? 0)} a year in no-shows.**`,
    "Arithmetic on their own no-show rate. We state the cost and say nothing",
    "about the share we would recover, because the cost is not arguable and a",
    "recovery rate would have been. It is the opening for scheduling and",
    "reminders rather than for intake.",
    `**Front desk hours freed: ${Math.round(up.hoursFreed).toLocaleString("en-US")} a year.**`,
    "Reported as hours. There is deliberately no dollar figure on them.",
    "",
    "Nothing is netted off for what Yosi costs. Price is a conversation to have",
    "with a number in front of you, not a variable buried inside one.",
    "",
  ];
  return lines.join("\n");
}

const doc = `# Practice health check: criteria to validate

*Generated from the code by \`npm run criteria\`. Do not edit by hand. Edit
\`src/lib/calc.ts\` and \`src/lib/score.ts\` and regenerate, or this sheet and the
app will disagree.*

Most of the model now comes from the data team's benchmark workbook (September
2026), which cites MGMA, BLS, HFMA and NIH-indexed studies and deliberately
excludes every competitor. Those constants are marked **Sourced** with their
source key.

Everything still marked **⚠️ Ours** is a number we made up so the screens would
work. It is on the attendee's phone, under "What are we assuming?", tagged as
ours, so it is arguable in public, which is the point. It still has to be right.

## What the workbook does not cover

Three things in the app have no benchmark behind them, and two of them are
load-bearing.

1. **No-shows.** The workbook has no no-show driver at all. It is the largest
   single component of the leak and its 35% recovery rate is ours. Worth asking
   the data team whether they could not source one or decided we should not
   claim it.
2. **Patient collections.** No driver in the workbook either. The whole
   component is ours.
3. **Reviews and online booking.** Ours. The workbook's growth driver is
   capacity, not reach.

## Three questions, now settled

- **The hourly rate stays unloaded.** $22 is the BLS median wage. Loading it
  for payroll tax and benefits would put it near $28 and raise the staff line
  by about a quarter, so what we show is the conservative reading.
- **The admin driver runs at full weight.** The workbook's driver is the $4.90
  before-and-after difference, and that is what we use. The $19.60 gross
  contains front desk labour, which is already the staff line, so using the
  gross would double count rather than strengthen anything.
- **The capacity conversion is gone.** It turned freed reception hours into
  clinical appointments, and a clinic is constrained by its providers, not its
  front desk. It was the largest figure on the screen and the easiest to argue
  with, which is the worst combination a booth can have. The hours are still
  reported, as hours.

## Nothing on the screen should invite an argument

Every figure now falls into one of two groups, and both are labelled on the
prospect's own phone:

- **Benchmarked.** From the workbook, naming its source key.
- **Our estimate.** Ours, and deliberately set below the range we could have
  justified. Under-claiming costs a booth conversation far less than
  over-claiming: one leaves money on the table, the other loses the room.

Three dollar figures were removed outright rather than softened, because no
wording makes an arguable number safe: the capacity conversion, and the review
and online-booking upsides. The first assumed reception hours become
appointment slots; the other two chained through local search ranking, which
we neither control nor measure. Both gaps are still named on the screen, with
no price attached.

Every surface also says plainly that this is an estimator and not an audit,
and that results vary with payer mix, schedule and how the desk runs today.

---

## 1 · The questions we ask

Four sliders, section 3. Nothing else is asked, and nothing is looked up.
Minutes per patient on registration is **not** asked. It is locked at
\`${ASSUMPTIONS.minutesPerIntakeToday.display}\` and printed in the assumptions.

| Input | Range | Used by |
| --- | --- | --- |
| Patients per day | 5–150 | Leak, score |
| No-show rate | 0–30% | Leak, score |
| Front desk headcount | 1–12 | Leak (cap), score |
| Patient balance collected up front | 0–100% | Leak, score |

Plus, from section 2: what they run today. And from 2b, asked of everyone:
how that is working out, and what actually costs them time. The first pair is
the only input to one quarter of the score. What costs them time is deliberately
**not** scored, because no-shows and collections are already dimensions and
counting a complaint about them again would score the same problem twice.

---

## 2 · The dollar model

### The leak: four components, summed

\`\`\`
missed     = patients/day × clinic days × no-show rate × net revenue per visit
staff      = minutes each ÷ 60 × patients/day × clinic days × loaded hourly rate
             capped at: headcount × paid hours per FTE × loaded hourly rate
rework     = patients/day × clinic days × rework rate × cost to rework one claim
collection = kept visits × patient responsibility
             × (1 − collected up front) × write-off rate

kept visits = patients/day × clinic days × (1 − no-show rate)
\`\`\`

The cap on \`staff\` exists because you cannot save more front desk time than
the front desk is paid for. Without it, a high-volume practice with a small desk
produces a figure a CFO throws out on sight.

### The return

\`\`\`
recovered = Σ (each leak component × its recovery rate)
cost      = platform fee × 12  +  completed intakes × per-intake price
net       = recovered − cost
multiple  = recovered ÷ cost          (gross, not net; the screen says so)
payback   = cost ÷ (recovered ÷ 12)   months
\`\`\`

Completed intakes, not booked visits, because a patient who no-shows does not fill in
a form, so we do not bill for one.

${table("Constants in the leak", ASSUMPTIONS as unknown as Record<string, Row>, "What we add to their answers to turn them into money.")}
${table("Recovery rates", RECOVERY as unknown as Record<string, Row>, "The share of each component we claim to recover. **These are the numbers a CFO will attack.** Every one is invented today.")}
${table("The growth half", GROWTH as unknown as Record<string, Row>, "Reduced to one entry. The three dollar figures that used to be here were the biggest and the most arguable numbers in the model, so they were removed rather than softened.")}

---

## 3 · The practice health score

Four dimensions, each scored 0–100 from an answer they gave, then weighted.
**Every weight and every band below is a placeholder.**

| Dimension | Weight | Measure | 100 at | 0 at |
| --- | --- | --- | --- | --- |
| Patients who show up | ${WEIGHTS.showRate}% | No-show rate | ${Math.round(BANDS.noShow.best * 100)}% | ${Math.round(BANDS.noShow.worst * 100)}% |
| Load on the front desk | ${WEIGHTS.deskLoad}% | Registration minutes per person per day | ${BANDS.deskMinutes.best} min | ${BANDS.deskMinutes.worst} min |
| How intake gets done | ${WEIGHTS.digitalIntake}% | What they run today | see below | see below |
| Money collected up front | ${WEIGHTS.collection}% | Share collected before or at the visit | ${Math.round(BANDS.collected.best * 100)}% | ${Math.round(BANDS.collected.worst * 100)}% |

Between the two ends, straight line. Registration minutes per person per day is
\`patients/day × ${ASSUMPTIONS.minutesPerIntakeToday.value} minutes ÷ headcount\`.

### How intake gets done, scored

Base, from what they selected in section 2:

| What they told us | Score |
| --- | --- |
${Object.values(INTAKE_POSTURE)
  .map((p) => `| ${p.label} | ${p.value} |`)
  .join("\n")}

Then section 2b asks how that is working out, of everyone rather than only of
people with a vendor, and an unhappy answer comes off the base:

| Their answer | Adjustment |
| --- | --- |
${Object.entries(SATISFACTION_PENALTY)
  .map(([k, v]) => `| ${k} | ${v === 0 ? "none" : v} |`)
  .join("\n")}

Downward only, and this is the part worth arguing about. A tool that frustrates
the people using it is doing less of the job than one that does not, so
dissatisfaction costs points. But a practice that is happy on paper is losing
the same hours either way, so being pleased with it earns nothing. A score that
could be talked upwards by liking your clipboard would deserve everything a CFO
said about it.

### Bands

Four bands, four colours. Four rather than three because three cannot separate
"this is fine" from "this works because people are absorbing it", which is the
distinction the whole conversation turns on, and five means two neighbouring
colours nobody can tell apart on a phone in a bright hall. The same four drive
the ring, the dimension bars and the follow-up email.

| Score | Label | Colour | What we say |
| --- | --- | --- | --- |
${SCORE_BANDS.map((b, i) => {
  const upper = i === 0 ? 100 : SCORE_BANDS[i - 1].min - 1;
  const hue = { good: "Green", ok: "Blue", warn: "Orange", bad: "Red" }[b.tone];
  return `| ${b.min}–${upper} | **${b.label}** | ${hue} \`${TONE[b.tone].solid}\` | ${b.blurb} |`;
}).join("\n")}

---

## 4 · Worked example

${worked()}

---

## 5 · What we need back

1. **Patient responsibility per visit** and the **write-off rate**, or a
   decision to drop that component.
3. **Answers to the three questions above** about the hourly rate, the $19.60,
   and the capacity conversion.
4. **The weights and bands in section 3.** Argue with them, because they were
   set to produce sensible-looking scores, which is not the same as being
   right.
5. **The three growth constants.** Visits per new patient, and the review and
   booking uplifts.

Nothing here needs a price. Cost was removed from the model deliberately: a
booth is the wrong place to divide by it.

Anything you change, change it in \`src/lib/calc.ts\` or \`src/lib/score.ts\` and
run \`npm run criteria\`. The prospect's screen, the follow-up and this sheet all
read from the same place.
`;

writeFileSync(new URL("../CRITERIA.md", import.meta.url), doc);
console.log("Wrote CRITERIA.md");
