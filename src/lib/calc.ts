/**
 * The money model: what intake is leaking, and what fixing it returns.
 *
 * Two halves that share one set of inputs.
 *
 *   calculate()  — the leak. Four components of annual loss, summed.
 *   roi()        — the return. What share of each component Yosi recovers,
 *                  less what Yosi costs, as a multiple and a payback period.
 *
 * The rule that governs both: every constant is printed on the screen next to
 * the number it produced, and every constant is tagged with who still has to
 * sign it off. A visible assumption gets argued with, and arguing is
 * engagement. An invisible one gets the whole thing dismissed as a sales toy.
 *
 * ── FOR SALES ────────────────────────────────────────────────────────────────
 * Everything marked `status: "placeholder"` is a number I made up to make the
 * screens work. Replace the `value` and set `status: "sourced"` with a real
 * `source`. Nothing else in the app has to change — the formulas, the screens
 * and the assumptions panel all read from here. See CRITERIA.md.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type CalcInputs = {
  patientsPerDay: number;
  noShowRate: number; // 0–1
  frontDeskStaff: number;
  /** Front desk minutes per patient on registration and intake. */
  minutesPerIntake: number;
  /** Share of patient responsibility collected before or at the visit. 0–1. */
  collectedRate: number;
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
      "Widely cited per-claim rework cost — staff time to identify, correct and resubmit.",
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
    source: "Used only to cap the staff-time component — see below.",
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
    internal: "Should be the easiest to evidence — we can measure it.",
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
 * What Yosi costs. Drives the payback period and the multiple.
 *
 * Modelled as platform fee plus per-intake so the ROI scales honestly with
 * practice size — a flat fee makes the number look absurd for a large practice
 * and impossible for a small one.
 */
export const PRICING = {
  baseMonthly: {
    value: 600,
    label: "Platform fee",
    display: "$600/mo",
    status: "placeholder" as const,
    source: "Our platform fee at your size.",
    internal: "Replace with real list price or the mid-market deal band.",
  },
  perIntake: {
    value: 1.1,
    label: "Per completed intake",
    display: "$1.10",
    status: "placeholder" as const,
    source: "Charged on intakes a patient actually completes.",
    internal: "Replace with the real per-transaction price.",
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
  minutesPerIntake: 7,
  collectedRate: 0.6,
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
    minutesPerIntake: n(raw.minutesPerIntake, 1, 30, d.minutesPerIntake),
    collectedRate: n(raw.collectedRate, 0, 1, d.collectedRate),
  };
}

export function calculate(rawInputs: Partial<CalcInputs>): CalcResult {
  const inputs = clampInputs(rawInputs);
  const A = ASSUMPTIONS;
  const visitsPerYear = inputs.patientsPerDay * A.workingDays.value;

  const missed = visitsPerYear * inputs.noShowRate * A.avgVisitRevenue.value;

  const staffRaw =
    (inputs.minutesPerIntake / 60) * visitsPerYear * A.loadedHourlyRate.value;
  // You cannot save more front desk time than the front desk is paid for. The
  // headcount input exists to enforce that ceiling — without it, a big practice
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
      formula: `${round1(inputs.minutesPerIntake)} min × ${inputs.patientsPerDay}/day × ${A.workingDays.display} days × ${A.loadedHourlyRate.display}`,
      note: staffCapped
        ? `Capped at ${inputs.frontDeskStaff} FTE of paid hours — the raw figure exceeded what your desk is paid for.`
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
// ROI
// ---------------------------------------------------------------------------

export type RoiLine = {
  key: CalcComponent["key"];
  label: string;
  leak: number;
  rate: number;
  amount: number;
};

export type RoiResult = {
  lines: RoiLine[];
  recovered: number;
  cost: number;
  costLines: { label: string; formula: string; amount: number }[];
  net: number;
  /** Recovered ÷ cost. "Every dollar returns $N." */
  multiple: number;
  /** Months of recovery it takes to cover a year of fees. */
  paybackMonths: number;
};

export function roi(result: CalcResult): RoiResult {
  const lines: RoiLine[] = result.components.map((c) => ({
    key: c.key,
    label: RECOVERY[c.key].label,
    leak: c.amount,
    rate: RECOVERY[c.key].value,
    amount: c.amount * RECOVERY[c.key].value,
  }));
  const recovered = lines.reduce((s, l) => s + l.amount, 0);

  const platform = PRICING.baseMonthly.value * 12;
  // Completed intakes, not booked visits — a no-show does not fill a form.
  const intakes = result.visitsPerYear * (1 - result.inputs.noShowRate);
  const perIntake = intakes * PRICING.perIntake.value;
  const cost = platform + perIntake;

  return {
    lines,
    recovered,
    cost,
    costLines: [
      {
        label: "Platform",
        formula: `${PRICING.baseMonthly.display} × 12`,
        amount: platform,
      },
      {
        label: "Completed intakes",
        formula: `${Math.round(intakes).toLocaleString("en-US")} × ${PRICING.perIntake.display}`,
        amount: perIntake,
      },
    ],
    net: recovered - cost,
    multiple: cost > 0 ? recovered / cost : 0,
    paybackMonths: recovered > 0 ? cost / (recovered / 12) : Infinity,
  };
}

/**
 * Role changes what gets read first, not what the number is.
 *
 * Weighting the *total* by who is answering is the fastest way to earn the
 * "sales toy" label the calculator is supposed to avoid — two people at the
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
 * biggest one — telling an RCM lead that "most of this lands in your AR" while
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
    return `${usd(mine.amount)} of it ${emphasis.owner} — the largest of the four.`;
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

/** Headline figure — rounded hard, because $184,217 reads as false precision. */
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
    ...Object.values(PRICING).map((c) => ({ ...c, group: "Price" })),
  ];
}
