/**
 * The money model: what intake is leaking, and what fixing it returns.
 *
 * Two halves that share one set of inputs.
 *
 *   calculate()  the leak. Four components of annual loss, summed.
 *   roi()        the return. What share of each component Yosi recovers,
 *                  less what Yosi costs, as a multiple and a payback period.
 *
 * The rule that governs both: every constant is printed on the screen next to
 * the number it produced, and every constant is tagged with who still has to
 * sign it off. A visible assumption gets argued with, and arguing is
 * engagement. An invisible one gets the whole thing dismissed as a sales toy.
 *
 * FOR SALES ────────────────────────────────────────────────────────────────
 * Everything marked `status: "placeholder"` is a number I made up to make the
 * screens work. Replace the `value` and set `status: "sourced"` with a real
 * `source`. Nothing else in the app has to change. The formulas, the screens
 * and the assumptions panel all read from here. See CRITERIA.md.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type CalcInputs = {
  patientsPerDay: number;
  noShowRate: number; // 0–1
  frontDeskStaff: number;
  /** Share of patient responsibility collected before or at the visit. 0–1. */
  collectedRate: number;
  /** New patients a month. Drives the growth half, not the leak. */
  newPatientsPerMonth: number;
};

type Constant = {
  value: number;
  label: string;
  display: string;
  status: "sourced" | "placeholder";
  /** Shown to the prospect, on their phone, next to the number. */
  source: string;
  /**
   * Never rendered. What has to happen before this number is defensible, for
   * CRITERIA.md and for whoever picks this up after the show. Kept out of
   * `source` because "NEEDS MARKETING SIGN-OFF" on a buyer's screen is not the
   * kind of transparency anyone was asking for.
   */
  internal?: string;
};

/** Inputs to the leak. What a practice loses. */
export const ASSUMPTIONS: Record<string, Constant> = {
  avgVisitRevenue: {
    value: 145,
    label: "Net revenue per completed visit",
    display: "$145",
    status: "placeholder",
    source:
      "Blended office-visit reimbursement. Benchmarked off the CMS Physician Fee Schedule for established-patient E/M, which women's health exceeds once ultrasound and in-office procedures are counted. We ignore that mix and use the lower number.",
    internal:
      "Carries the largest component of the leak. Marketing to confirm the blended figure before the show.",
  },
  loadedHourlyRate: {
    value: 26,
    label: "Loaded front desk hourly cost",
    display: "$26/hr",
    status: "sourced",
    source:
      "BLS occupational wage for medical secretaries and administrative assistants, loaded roughly 1.3x for payroll tax and benefits.",
  },
  patientResponsibility: {
    value: 32,
    label: "Patient responsibility per visit",
    display: "$32",
    status: "placeholder",
    source:
      "Average copay plus coinsurance and deductible owed by the patient on an office visit.",
    internal: "Replace with the average off our own book of customers.",
  },
  writeOffRate: {
    value: 0.4,
    label: "Uncollected balance never recovered",
    display: "40%",
    status: "placeholder",
    source:
      "Share of patient balances not collected at the time of service that are eventually written off rather than recovered by statements or collections.",
    internal: "Invented. Needs a real write-off rate.",
  },
  minutesPerIntake: {
    value: 14,
    label: "Front desk minutes per patient on registration",
    display: "14 min",
    status: "placeholder",
    source:
      "Checking them in, keying the form into the chart, and chasing the coverage. Excludes the patient's own form-filling time.",
    internal:
      "Locked at 14 by Logan rather than asked for. It drives both the staff component and a quarter of the score, so it is the highest-leverage constant in the model after the recovery rates.",
  },
  reworkRate: {
    value: 0.05,
    label: "Claims reworked for registration errors",
    display: "5%",
    status: "placeholder",
    source:
      "Share of claims needing rework because of a demographic, coverage or eligibility error caught after the fact. Industry initial-denial rates run higher; this counts only the registration-driven slice.",
    internal:
      "Needs a citation. Smallest component, so the least urgent of the four.",
  },
  costToRework: {
    value: 25,
    label: "Cost to rework one claim",
    display: "$25",
    status: "sourced",
    source:
      "Widely cited per-claim rework cost: staff time to identify, correct and resubmit.",
  },
  workingDays: {
    value: 250,
    label: "Clinic days per year",
    display: "250",
    status: "sourced",
    source: "Five days a week, less holidays and closures.",
  },
  paidHoursPerFte: {
    value: 2080,
    label: "Paid hours per front desk FTE",
    display: "2,080",
    status: "sourced",
    source: "Used only to cap the staff-time component. See below.",
  },
};

/**
 * Inputs to the ROI. What share of each leak component Yosi actually recovers.
 *
 * These are the numbers a CFO will push hardest on, and they are the ones we
 * have the least right to guess at. Every one is a placeholder until it comes
 * off our own book of customers.
 */
export const RECOVERY: Record<CalcComponent["key"], Constant> = {
  missed: {
    value: 0.35,
    label: "No-shows recovered",
    display: "35%",
    status: "placeholder",
    source:
      "Share of no-shows avoided by pre-visit reminders, digital intake completed before arrival, and waitlist backfill.",
    internal:
      "The single most aggressive number in the model and the first one a CFO will attack. Needs before/after data from real customers.",
  },
  staff: {
    value: 0.6,
    label: "Manual entry removed",
    display: "60%",
    status: "placeholder",
    source:
      "Share of front desk registration minutes removed when the patient completes intake before arrival and it writes back to the chart. The remainder is exceptions, walk-ins and the patients who will always need help.",
    internal: "Should be the easiest to evidence, because we can measure it.",
  },
  rework: {
    value: 0.5,
    label: "Registration rework avoided",
    display: "50%",
    status: "placeholder",
    source:
      "Share of registration-driven claim rework avoided by verifying eligibility before the visit rather than after.",
    internal: "Needs a customer denial-rate before/after.",
  },
  collection: {
    value: 0.5,
    label: "Patient balance recovered",
    display: "50%",
    status: "placeholder",
    source:
      "Share of the currently-uncollected balance captured when the ask happens on the phone before the visit rather than at the desk.",
    internal: "Needs a customer collection-rate before/after.",
  },
};

/**
 * What a new patient is worth in their first year.
 *
 * The growth half needs one figure the leak half does not: a new patient is
 * not one visit. This is deliberately first-year only. Lifetime value is a
 * bigger, truer and far less defensible number, and at a booth the bigger
 * number is the one that gets you argued with rather than believed.
 */
export const GROWTH = {
  visitsPerNewPatient: {
    value: 2.4,
    label: "Visits from a new patient in year one",
    display: "2.4",
    status: "placeholder" as const,
    source:
      "A first visit plus the follow-ups it leads to, inside twelve months. Women's health runs higher than this once obstetrics is counted; we use the lower figure.",
    internal: "Needs a real figure off our own book.",
  },
  reviewUplift: {
    value: 0.08,
    label: "More new patients from a better review profile",
    display: "8%",
    status: "placeholder" as const,
    source:
      "Asking every patient for a review after the visit moves the rating and the count, which moves where you rank when somebody searches for a practice near them.",
    internal:
      "The softest number in the model. It chains through local search ranking, which we do not control and cannot measure directly. Treat as directional until somebody has before-and-after data.",
  },
  bookingUplift: {
    value: 0.12,
    label: "More new patients from online booking",
    display: "12%",
    status: "placeholder" as const,
    source:
      "Share of people who find you and then give up because booking means phoning during office hours.",
    internal: "Needs a real drop-off figure. Should be measurable from our own booking funnel.",
  },
};

export type CalcComponent = {
  key: "missed" | "staff" | "rework" | "collection";
  label: string;
  amount: number;
  formula: string;
  note?: string;
};

export type CalcResult = {
  inputs: CalcInputs;
  visitsPerYear: number;
  components: CalcComponent[];
  total: number;
  /** Staff component as a share of the front desk's total paid hours. */
  staffShareOfPayroll: number;
  staffCapped: boolean;
  assumptions: typeof ASSUMPTIONS;
};

export const INPUT_DEFAULTS: CalcInputs = {
  patientsPerDay: 40,
  noShowRate: 0.12,
  frontDeskStaff: 3,
  collectedRate: 0.6,
  newPatientsPerMonth: 30,
};

export function clampInputs(raw: Partial<CalcInputs>): CalcInputs {
  const n = (v: unknown, lo: number, hi: number, dflt: number) => {
    const x = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(x)) return dflt;
    return Math.min(hi, Math.max(lo, x));
  };
  const d = INPUT_DEFAULTS;
  return {
    patientsPerDay: Math.round(n(raw.patientsPerDay, 1, 500, d.patientsPerDay)),
    noShowRate: n(raw.noShowRate, 0, 0.6, d.noShowRate),
    frontDeskStaff: Math.round(n(raw.frontDeskStaff, 1, 100, d.frontDeskStaff)),
    collectedRate: n(raw.collectedRate, 0, 1, d.collectedRate),
    newPatientsPerMonth: Math.round(
      n(raw.newPatientsPerMonth, 0, 400, d.newPatientsPerMonth),
    ),
  };
}

export function calculate(rawInputs: Partial<CalcInputs>): CalcResult {
  const inputs = clampInputs(rawInputs);
  const A = ASSUMPTIONS;
  const visitsPerYear = inputs.patientsPerDay * A.workingDays.value;

  const missed = visitsPerYear * inputs.noShowRate * A.avgVisitRevenue.value;

  const staffRaw =
    (A.minutesPerIntake.value / 60) * visitsPerYear * A.loadedHourlyRate.value;
  // You cannot save more front desk time than the front desk is paid for. The
  // headcount input exists to enforce that ceiling. Without it, a big practice
  // with a small desk produces a number that a CFO throws out on sight.
  const staffCap =
    inputs.frontDeskStaff * A.paidHoursPerFte.value * A.loadedHourlyRate.value;
  const staff = Math.min(staffRaw, staffCap);
  const staffCapped = staffRaw > staffCap;

  const rework = visitsPerYear * A.reworkRate.value * A.costToRework.value;

  // Only the visits that actually happen owe anything.
  const keptVisits = visitsPerYear * (1 - inputs.noShowRate);
  const owed = keptVisits * A.patientResponsibility.value;
  const collection =
    owed * (1 - inputs.collectedRate) * A.writeOffRate.value;

  const components: CalcComponent[] = [
    {
      key: "missed",
      label: "Missed visit revenue",
      amount: missed,
      formula: `${inputs.patientsPerDay}/day × ${A.workingDays.display} days × ${pct(inputs.noShowRate)} no-show × ${A.avgVisitRevenue.display}`,
      note: "Appointments that never happened. Reminders and pre-visit intake are what move this.",
    },
    {
      key: "staff",
      label: "Front desk time on manual entry",
      amount: staff,
      formula: `${A.minutesPerIntake.display} × ${inputs.patientsPerDay}/day × ${A.workingDays.display} days × ${A.loadedHourlyRate.display}`,
      note: staffCapped
        ? `Capped at ${inputs.frontDeskStaff} FTE of paid hours. The raw figure exceeded what your desk is paid for.`
        : "Hours your desk spends keying in what the patient already wrote down.",
    },
    {
      key: "rework",
      label: "Claim rework from intake errors",
      amount: rework,
      formula: `${inputs.patientsPerDay}/day × ${A.workingDays.display} days × ${A.reworkRate.display} × ${A.costToRework.display}`,
      note: "Denials traced back to a bad demographic or an unverified plan.",
    },
    {
      key: "collection",
      label: "Patient balances written off",
      amount: collection,
      formula: `${Math.round(keptVisits).toLocaleString("en-US")} visits × ${A.patientResponsibility.display} × ${pct(1 - inputs.collectedRate)} uncollected × ${A.writeOffRate.display}`,
      note: "What is owed at the desk, not collected at the desk, and never recovered.",
    },
  ];

  return {
    inputs,
    visitsPerYear,
    components,
    total: components.reduce((s, c) => s + c.amount, 0),
    staffShareOfPayroll: staff / staffCap,
    staffCapped,
    assumptions: A,
  };
}

// ---------------------------------------------------------------------------
// What fixing it is worth
//
// Two halves that do different jobs and must not be added together on the
// screen without saying which is which. Recovery is money the practice is
// already losing out of an operation that exists. Growth is money it has never
// earned. One is an argument about waste, the other an argument about demand,
// and a buyer who conflates them stops believing both.
//
// Neither is netted against what Yosi costs. Price is a conversation to have
// with a number in front of you, not a variable to bury inside one, and a
// booth is the wrong place to have it.
// ---------------------------------------------------------------------------

export type ValueLine = {
  key: string;
  label: string;
  basis: string;
  amount: number;
};

export type RecoveryResult = { lines: ValueLine[]; total: number };

export function recovery(result: CalcResult): RecoveryResult {
  const lines: ValueLine[] = result.components.map((c) => ({
    key: c.key,
    label: RECOVERY[c.key].label,
    basis: `${pct(RECOVERY[c.key].value)} of ${usd(c.amount)}`,
    amount: c.amount * RECOVERY[c.key].value,
  }));
  return { lines, total: lines.reduce((s, l) => s + l.amount, 0) };
}

export type GrowthContext = {
  /** Patients can book without phoning during office hours. */
  onlineBooking?: boolean;
  /** Every patient is asked for a review after the visit. */
  asksForReviews?: boolean;
};

export type GrowthResult = {
  lines: ValueLine[];
  total: number;
  newPatientValue: number;
  /** True when they already do both and there is nothing here to win. */
  alreadyDoing: boolean;
};

/**
 * New patients they are not getting.
 *
 * Only the gap is counted. A practice that already asks for reviews and
 * already takes online bookings gets nothing here and is told so, which is the
 * whole reason the number is worth reading when it is not zero.
 */
export function growth(
  result: CalcResult,
  ctx: GrowthContext = {},
): GrowthResult {
  const A = ASSUMPTIONS;
  const newPerYear = result.inputs.newPatientsPerMonth * 12;
  const newPatientValue =
    GROWTH.visitsPerNewPatient.value * A.avgVisitRevenue.value;

  const lines: ValueLine[] = [];
  if (!ctx.asksForReviews) {
    lines.push({
      key: "reviews",
      label: "Found by more people",
      basis: `${newPerYear.toLocaleString("en-US")} new patients a year × ${GROWTH.reviewUplift.display} × ${usd(newPatientValue)}`,
      amount: newPerYear * GROWTH.reviewUplift.value * newPatientValue,
    });
  }
  if (!ctx.onlineBooking) {
    lines.push({
      key: "booking",
      label: "Booked instead of lost",
      basis: `${newPerYear.toLocaleString("en-US")} new patients a year × ${GROWTH.bookingUplift.display} × ${usd(newPatientValue)}`,
      amount: newPerYear * GROWTH.bookingUplift.value * newPatientValue,
    });
  }

  return {
    lines,
    total: lines.reduce((s, l) => s + l.amount, 0),
    newPatientValue,
    alreadyDoing: lines.length === 0,
  };
}

/**
 * Role changes what gets read first, not what the number is.
 *
 * Weighting the *total* by who is answering is the fastest way to earn the
 * "sales toy" label the calculator is supposed to avoid, because two people at the
 * same practice would get two different answers and neither would trust
 * either. So role reorders the components and writes the lead line; the
 * arithmetic is identical for everyone.
 */
export const ROLE_EMPHASIS: Record<
  string,
  { order: CalcComponent["key"][]; owns: CalcComponent["key"]; owner: string }
> = {
  billing: {
    order: ["rework", "collection", "missed", "staff"],
    owns: "rework",
    owner: "lands in your AR",
  },
  frontdesk: {
    order: ["staff", "missed", "collection", "rework"],
    owns: "staff",
    owner: "is hours at your desk",
  },
  owner: {
    order: ["missed", "collection", "rework", "staff"],
    owns: "missed",
    owner: "is revenue that never posted",
  },
};

export function orderComponents(
  result: CalcResult,
  role: string | null | undefined,
): CalcComponent[] {
  const emphasis = ROLE_EMPHASIS[role ?? ""];
  if (!emphasis) return result.components;
  return emphasis.order
    .map((k) => result.components.find((c) => c.key === k))
    .filter((c): c is CalcComponent => Boolean(c));
}

/**
 * The one line under the headline figure. Built from the actual numbers rather
 * than written in advance, because the role's own component is often not the
 * biggest one. Telling an RCM lead that "most of this lands in your AR" while
 * the screen shows rework as the smallest of four is exactly the kind of
 * overclaim that loses the room.
 */
export function roleLead(
  result: CalcResult,
  role: string | null | undefined,
): string | null {
  const emphasis = ROLE_EMPHASIS[role ?? ""];
  if (!emphasis) return null;
  const mine = result.components.find((c) => c.key === emphasis.owns);
  if (!mine) return null;
  const biggest = [...result.components].sort((a, b) => b.amount - a.amount)[0];
  const share = Math.round((mine.amount / result.total) * 100);

  if (biggest.key === emphasis.owns) {
    return `${usd(mine.amount)} of it ${emphasis.owner}, the largest of the four.`;
  }
  return `${usd(mine.amount)} of it ${emphasis.owner}, about ${share}%. The bigger driver is ${biggest.label.toLowerCase()}.`;
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function round1(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function usd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/** Headline figure, rounded hard: $184,217 reads as false precision. */
export function usdRounded(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  const thousands = Math.round(n / 1000);
  return `$${thousands.toLocaleString("en-US")},000`;
}

/** Every constant in the model, for the assumptions panel and CRITERIA.md. */
export function allConstants(): (Constant & { group: string })[] {
  return [
    ...Object.values(ASSUMPTIONS).map((c) => ({ ...c, group: "Leak" })),
    ...Object.values(RECOVERY).map((c) => ({ ...c, group: "Recovery" })),
    ...Object.values(GROWTH).map((c) => ({ ...c, group: "Growth" })),
  ];
}
