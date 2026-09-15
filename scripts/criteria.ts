/**
 * Generates CRITERIA.md — the one-page sheet sales and marketing mark up.
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
  PRICING,
  RECOVERY,
  calculate,
  roi,
  usd,
  type CalcInputs,
} from "../src/lib/calc";
import {
  BANDS,
  INTAKE_POSTURE,
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

const OWNER = {
  avgVisitRevenue: "Marketing",
  loadedHourlyRate: "—",
  patientResponsibility: "RCM",
  writeOffRate: "RCM",
  reworkRate: "RCM",
  costToRework: "—",
  workingDays: "—",
  paidHoursPerFte: "—",
  missed: "Customer success",
  staff: "Customer success",
  rework: "Customer success",
  collection: "Customer success",
  baseMonthly: "Sales",
  perIntake: "Sales",
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
    const owner = OWNER[key as keyof typeof OWNER] ?? "—";
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
};

function worked(): string {
  const r = calculate(EXAMPLE);
  const ret = roi(r);
  const s = score({
    inputs: EXAMPLE,
    techStack: ["athenahealth", "Phreesia"],
    competitorSatisfaction: "It frustrates us",
  });

  const lines = [
    "A practice seeing **45 patients a day**, **14% no-show**, **3 on the front desk**,",
    "**50%** of patient balance collected up front,",
    "already running athenahealth and an intake vendor they are unhappy with.",
    "",
    `**Practice health score: ${s.total} — ${s.band.label}**`,
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
    `**Return: ${usd(ret.recovered)} recovered − ${usd(ret.cost)} cost = ${usd(ret.net)} net.**`,
    `${ret.multiple.toFixed(2)}x on spend, payback in ${ret.paybackMonths.toFixed(1)} months.`,
    "",
  ];
  return lines.join("\n");
}

const doc = `# Practice health check — criteria to validate

*Generated from the code by \`npm run criteria\`. Do not edit by hand — edit
\`src/lib/calc.ts\` and \`src/lib/score.ts\` and regenerate, or this sheet and the
app will disagree.*

Everything marked **⚠️ Ours** is a number we made up so the screens would work.
It is on the attendee's phone, under "What are we assuming?", tagged as ours —
so it is arguable in public, which is the point. It still has to be right.

---

## 1 · The questions we ask

Four sliders, section 3. Nothing else is asked, and nothing is looked up.
Minutes per patient on registration is **not** asked — it is locked at
\`${ASSUMPTIONS.minutesPerIntake.display}\` and printed in the assumptions.

| Input | Range | Used by |
| --- | --- | --- |
| Patients per day | 5–150 | Leak, score |
| No-show rate | 0–30% | Leak, score |
| Front desk headcount | 1–12 | Leak (cap), score |
| Patient balance collected up front | 0–100% | Leak, score |

Plus, from section 2: what they run today, and — if that includes an intake
vendor — whether it is working. That pair is the only input to one quarter of
the score.

---

## 2 · The dollar model

### The leak — four components, summed

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
multiple  = recovered ÷ cost          (gross, not net — the screen says so)
payback   = cost ÷ (recovered ÷ 12)   months
\`\`\`

Completed intakes, not booked visits — a patient who no-shows does not fill in
a form, so we do not bill for one.

${table("Constants in the leak", ASSUMPTIONS as unknown as Record<string, Row>, "What we add to their answers to turn them into money.")}
${table("Recovery rates", RECOVERY as unknown as Record<string, Row>, "The share of each component we claim to recover. **These are the numbers a CFO will attack.** Every one is invented today.")}
${table("What we charge", PRICING as unknown as Record<string, Row>, "Drives the payback period and the multiple. Modelled as fee plus per-intake so the ROI scales honestly with practice size.")}

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
\`patients/day × ${ASSUMPTIONS.minutesPerIntake.value} minutes ÷ headcount\`.

### How intake gets done, scored

| What they told us | Score |
| --- | --- |
${Object.values(INTAKE_POSTURE)
  .map((p) => `| ${p.label} | ${p.value} |`)
  .join("\n")}

An intake vendor they are unhappy with scores below one that works, and above
paper. That is deliberate: they have already bought the category, which is the
easiest sale we have, but the incumbent is still doing part of the job.

### Bands

Four bands, four colours. Four rather than three because three cannot separate
"this is fine" from "this works because people are absorbing it", which is the
distinction the whole conversation turns on — and five means two neighbouring
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

1. **The four recovery rates.** Highest priority — they are the entire ROI half
   and none of them is evidenced. No-shows first; it is the largest and the
   least defensible.
2. **Net revenue per completed visit.** Carries the largest single component of
   the leak.
3. **Patient responsibility per visit** and the **write-off rate**.
4. **Price.** Whatever the ROI should be divided by.
5. **The weights and bands in section 3.** Argue with them — they were set to
   produce sensible-looking scores, which is not the same as being right.

Anything you change, change it in \`src/lib/calc.ts\` or \`src/lib/score.ts\` and
run \`npm run criteria\`. The prospect's screen, the follow-up and this sheet all
read from the same place.
`;

writeFileSync(new URL("../CRITERIA.md", import.meta.url), doc);
console.log("Wrote CRITERIA.md");
