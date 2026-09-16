/**
 * The practice health score.
 *
 * Four dimensions, each scored 0–100 from an answer the prospect actually
 * gave, then weighted into one number. It exists because "check the health of
 * your practice" promises a diagnosis, and a dollar figure on its own is a
 * bill, not a diagnosis. A score says where you stand, a dollar figure says
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

import { ASSUMPTIONS, type CalcInputs } from "./calc";
import { intakeMode } from "./tech-stack";

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

export type ScoreTone = "good" | "ok" | "warn" | "bad";

export type ScoreBand = {
  min: number;
  label: string;
  blurb: string;
  tone: ScoreTone;
};

/**
 * The health palette. Four bands, four colours, one definition.
 *
 * Four rather than three or five because three cannot separate "this is fine"
 * from "this works because people are absorbing it", which is the distinction
 * the whole conversation turns on, and five means two neighbouring colours
 * nobody can tell apart on a phone in a bright hall.
 *
 * Hex rather than Tailwind classes because the same four colours have to drive
 * an SVG gradient, a progress bar and an HTML email, and an email cannot see a
 * stylesheet. One map, three surfaces, no drift.
 *
 * Each band is a two-stop gradient of its own hue: light into deep, which is
 * what gives the ring its weight. The green one is the showiest on purpose:
 * it is the only score anybody is pleased to see.
 */
export const TONE: Record<
  ScoreTone,
  { from: string; to: string; solid: string; soft: string }
> = {
  good: { from: "#4ade80", to: "#15803d", solid: "#16a34a", soft: "#dcfce7" },
  ok: { from: "#60a5fa", to: "#1d4ed8", solid: "#2563eb", soft: "#dbeafe" },
  warn: { from: "#fb923c", to: "#c2410c", solid: "#ea580c", soft: "#ffedd5" },
  bad: { from: "#f87171", to: "#b91c1c", solid: "#dc2626", soft: "#fee2e2" },
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
  /**
   * Front desk minutes per FTE per day spent on registration.
   *
   * Recalibrated when minutes-per-patient stopped being a slider and was
   * locked at 14. At that figure the old 30–240 band scored almost every
   * practice near zero, which is not a diagnosis but a broken instrument.
   * 60 is a desk with almost nothing to key; 420 is seven hours of a shift.
   */
  deskMinutes: { best: 60, worst: 420 },
  /** Share of patient responsibility collected before or at the visit. */
  collected: { best: 0.95, worst: 0.2 },
} as const;

/** How intake is done today, before satisfaction is taken off. Placeholders. */
export const INTAKE_POSTURE = {
  vendor: { value: 85, label: "Digital intake vendor in place" },
  portal: { value: 50, label: "EHR patient portal only" },
  paper: { value: 15, label: "Paper, clipboard or keyed by the desk" },
  unknown: { value: 30, label: "Nothing digital in the workflow" },
} as const;

/**
 * What an unhappy answer takes off the posture. Placeholders.
 *
 * Downward only, and this is the part worth arguing about. A tool that
 * frustrates the people using it is doing less of the job than one that does
 * not, so dissatisfaction costs points. But a practice that is happy on paper
 * is still losing the same hours, so being pleased with it earns nothing. A
 * score that could be talked upwards by liking your clipboard would deserve
 * everything a CFO said about it.
 */
export const SATISFACTION_PENALTY: Record<string, number> = {
  "Works well, we would keep it": 0,
  "It's fine": -5,
  "It frustrates us": -15,
  "We're actively looking to change it": -25,
};

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

/**
 * Which band a 0–100 value falls in.
 *
 * Exported so the individual dimension bars, the ring and the band label all
 * read the same thresholds. They used to be written out three times and had
 * already drifted once.
 */
export function toneFor(value: number): ScoreTone {
  return (SCORE_BANDS.find((b) => value >= b.min) ?? SCORE_BANDS.at(-1)!).tone;
}

export type ScoreResult = {
  total: number;
  band: ScoreBand;
  dimensions: ScoreDimension[];
};

export type ScoreContext = {
  inputs: CalcInputs;
  techStack: string[];
  /** Their answer to "how is that working out", whatever "that" is. */
  intakeSatisfaction?: string | null;
};

/** 100 at `best`, 0 at `worst`, linear between. Works in either direction. */
function band(value: number, best: number, worst: number): number {
  const span = worst - best;
  if (span === 0) return 100;
  const t = (value - best) / span;
  return Math.round(Math.max(0, Math.min(1, 1 - t)) * 100);
}

export function intakePosture(
  techStack: string[],
  satisfaction?: string | null,
): { value: number; label: string } {
  const base = INTAKE_POSTURE[intakeMode(techStack)];
  const penalty = satisfaction ? (SATISFACTION_PENALTY[satisfaction] ?? 0) : 0;
  const value = Math.max(0, Math.min(100, base.value + penalty));
  return {
    value,
    label: penalty < 0 ? `${base.label}, and not working well` : base.label,
  };
}

export function score(ctx: ScoreContext): ScoreResult {
  const { inputs } = ctx;

  const deskMinutes =
    (inputs.patientsPerDay * ASSUMPTIONS.minutesPerIntake.value) /
    inputs.frontDeskStaff;
  const posture = intakePosture(ctx.techStack, ctx.intakeSatisfaction);

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
      note: `Patients/day × ${ASSUMPTIONS.minutesPerIntake.display} each ÷ headcount. This is the one we cut first.`,
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
 * Where the most score is available, and what the screen and the follow-up email
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
