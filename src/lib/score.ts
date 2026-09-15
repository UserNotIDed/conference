/**
 * The practice health score.
 *
 * Four dimensions, each scored 0–100 from an answer the prospect actually
 * gave, then weighted into one number. It exists because "check the health of
 * your practice" promises a diagnosis, and a dollar figure on its own is a
 * bill, not a diagnosis — a score says where you stand, a dollar figure says
 * what it costs, and the two do different jobs in the same conversation.
 *
 * Same rule as the money model: every weight and every band is printed on the
 * screen. A composite index that will not show its own arithmetic deserves
 * every bit of the scepticism it gets.
 *
 * ── FOR SALES ────────────────────────────────────────────────────────────────
 * WEIGHTS and every BAND below are placeholders. They are internally
 * consistent and they produce sensible-looking scores, but nothing about them
 * is validated. See CRITERIA.md for the one-page version to mark up.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { CalcInputs } from "./calc";
import { COMPETITOR_TOOLS } from "./tech-stack";

export type ScoreDimension = {
  key: "showRate" | "deskLoad" | "digitalIntake" | "collection";
  label: string;
  /** Contribution to the total, out of 100. */
  weight: number;
  /** This dimension on its own, 0–100. */
  value: number;
  /** Their answer, as they gave it. */
  detail: string;
  /** Where the band came from. */
  basis: string;
  /** What moves it. The marketing line. */
  note: string;
};

export type ScoreBand = {
  min: number;
  label: string;
  blurb: string;
  tone: "good" | "ok" | "warn" | "bad";
};

/** Weights sum to 100. Placeholders. */
export const WEIGHTS = {
  showRate: 30,
  deskLoad: 25,
  digitalIntake: 25,
  collection: 20,
} as const;

/**
 * Each band is [best, worst] on the underlying measure. 100 at or beyond
 * `best`, 0 at or beyond `worst`, straight line between. Placeholders.
 */
export const BANDS = {
  /** No-show rate. */
  noShow: { best: 0.03, worst: 0.2 },
  /** Front desk minutes per FTE per day spent on registration. */
  deskMinutes: { best: 30, worst: 240 },
  /** Share of patient responsibility collected before or at the visit. */
  collected: { best: 0.95, worst: 0.2 },
} as const;

/** How intake is done today, scored straight. Placeholders. */
export const INTAKE_POSTURE = {
  vendorHappy: { value: 85, label: "Digital intake vendor in place" },
  vendorUnhappy: { value: 55, label: "Intake vendor in place, not working" },
  portal: { value: 50, label: "EHR patient portal only" },
  paper: { value: 15, label: "Paper, clipboard or keyed by the desk" },
  unknown: { value: 30, label: "Nothing digital in the workflow" },
} as const;

export const SCORE_BANDS: ScoreBand[] = [
  {
    min: 80,
    label: "Healthy",
    blurb: "Your front desk is not where your revenue is going.",
    tone: "good",
  },
  {
    min: 65,
    label: "Holding",
    blurb: "It works, and it works because people are absorbing the gaps.",
    tone: "ok",
  },
  {
    min: 50,
    label: "Under strain",
    blurb: "Volume is outrunning the process at the front of the visit.",
    tone: "warn",
  },
  {
    min: 0,
    label: "At risk",
    blurb: "Intake is costing you more than it would cost to fix.",
    tone: "bad",
  },
];

export type ScoreResult = {
  total: number;
  band: ScoreBand;
  dimensions: ScoreDimension[];
};

export type ScoreContext = {
  inputs: CalcInputs;
  techStack: string[];
  competitorSatisfaction?: string | null;
};

/** 100 at `best`, 0 at `worst`, linear between. Works in either direction. */
function band(value: number, best: number, worst: number): number {
  const span = worst - best;
  if (span === 0) return 100;
  const t = (value - best) / span;
  return Math.round(Math.max(0, Math.min(1, 1 - t)) * 100);
}

const PAPER = new Set([
  "Paper on a clipboard",
  "Front desk keys it in",
  "None of these — we do it all by hand",
]);

export function intakePosture(
  techStack: string[],
  competitorSatisfaction?: string | null,
): (typeof INTAKE_POSTURE)[keyof typeof INTAKE_POSTURE] {
  const hasVendor = techStack.some((t) => COMPETITOR_TOOLS.has(t));
  if (hasVendor) {
    const sour =
      competitorSatisfaction &&
      /frustrat|replace/i.test(competitorSatisfaction);
    return sour ? INTAKE_POSTURE.vendorUnhappy : INTAKE_POSTURE.vendorHappy;
  }
  if (techStack.some((t) => PAPER.has(t))) return INTAKE_POSTURE.paper;
  if (techStack.some((t) => /portal/i.test(t))) return INTAKE_POSTURE.portal;
  return INTAKE_POSTURE.unknown;
}

export function score(ctx: ScoreContext): ScoreResult {
  const { inputs } = ctx;

  const deskMinutes =
    (inputs.patientsPerDay * inputs.minutesPerIntake) / inputs.frontDeskStaff;
  const posture = intakePosture(ctx.techStack, ctx.competitorSatisfaction);

  const dimensions: ScoreDimension[] = [
    {
      key: "showRate",
      label: "Patients who show up",
      weight: WEIGHTS.showRate,
      value: band(inputs.noShowRate, BANDS.noShow.best, BANDS.noShow.worst),
      detail: `${Math.round(inputs.noShowRate * 100)}% no-show`,
      basis: `100 at ${Math.round(BANDS.noShow.best * 100)}%, 0 at ${Math.round(BANDS.noShow.worst * 100)}%`,
      note: "Reminders and intake finished before arrival are what move this.",
    },
    {
      key: "deskLoad",
      label: "Load on the front desk",
      weight: WEIGHTS.deskLoad,
      value: band(deskMinutes, BANDS.deskMinutes.best, BANDS.deskMinutes.worst),
      detail: `${Math.round(deskMinutes)} min per person per day on registration`,
      basis: `100 at ${BANDS.deskMinutes.best} min, 0 at ${BANDS.deskMinutes.worst} min`,
      note: "Patients/day × minutes each ÷ headcount. This is the one we cut first.",
    },
    {
      key: "digitalIntake",
      label: "How intake gets done",
      weight: WEIGHTS.digitalIntake,
      value: posture.value,
      detail: posture.label,
      basis: "Scored from what you told us you run",
      note: "Anything the patient can finish on their own phone scores here.",
    },
    {
      key: "collection",
      label: "Money collected up front",
      weight: WEIGHTS.collection,
      value: band(
        inputs.collectedRate,
        BANDS.collected.best,
        BANDS.collected.worst,
      ),
      detail: `${Math.round(inputs.collectedRate * 100)}% collected before or at the visit`,
      basis: `100 at ${Math.round(BANDS.collected.best * 100)}%, 0 at ${Math.round(BANDS.collected.worst * 100)}%`,
      note: "Asked on the phone before the visit, not at a desk with a queue behind it.",
    },
  ];

  const total = Math.round(
    dimensions.reduce((s, d) => s + (d.value * d.weight) / 100, 0),
  );

  return {
    total,
    band: SCORE_BANDS.find((b) => total >= b.min) ?? SCORE_BANDS.at(-1)!,
    dimensions,
  };
}

/**
 * Where the most score is available — what the screen and the follow-up email
 * should both lead with.
 *
 * Headroom, `(100 − value) × weight`, not the lowest score and not the smallest
 * contribution. The lowest score ignores how much the dimension is worth; the
 * smallest contribution always picks the lowest-weighted dimension, which can
 * never contribute much however good it is. Headroom asks the only useful
 * question: fix one of these, which one moves the number most?
 */
export function biggestGap(result: ScoreResult): ScoreDimension {
  return [...result.dimensions].sort(
    (a, b) => (100 - b.value) * b.weight - (100 - a.value) * a.weight,
  )[0];
}
