/**
 * The intake leak calculator.
 *
 * Three inputs an attendee knows without looking anything up, three cost
 * components summed. The rule that matters: every assumption is printed on the
 * screen next to the number. A visible assumption gets argued with, and arguing
 * is engagement. An invisible one gets the whole thing dismissed as a sales toy.
 *
 * Swap ASSUMPTIONS for whatever figures marketing will stand behind before the
 * show. They are deliberately conservative and deliberately few.
 */

export type CalcInputs = {
  patientsPerDay: number;
  noShowRate: number; // 0–1
  frontDeskStaff: number;
};

export const ASSUMPTIONS = {
  avgVisitRevenue: {
    value: 145,
    label: "Net revenue per completed visit",
    display: "$145",
    source:
      "Blended office-visit reimbursement. Benchmarked off the CMS Physician Fee Schedule for established-patient E/M, which women's health exceeds once ultrasound and in-office procedures are counted. We ignore that mix and use the lower number.",
  },
  loadedHourlyRate: {
    value: 26,
    label: "Loaded front desk hourly cost",
    display: "$26/hr",
    source:
      "BLS occupational wage for medical secretaries and administrative assistants, loaded roughly 1.3x for payroll tax and benefits.",
  },
  minutesPerIntake: {
    value: 7,
    label: "Manual entry per patient",
    display: "7 min",
    source:
      "Keying a paper or clipboard intake into the chart, plus the eligibility lookup. Excludes the patient's own form-filling time.",
  },
  reworkRate: {
    value: 0.05,
    label: "Claims reworked for registration or eligibility errors",
    display: "5%",
    source:
      "Share of claims needing rework because of a demographic, coverage or eligibility error caught after the fact. Industry initial-denial rates run higher; this counts only the registration-driven slice.",
  },
  costToRework: {
    value: 25,
    label: "Cost to rework one claim",
    display: "$25",
    source:
      "Widely cited per-claim rework cost — staff time to identify, correct and resubmit.",
  },
  workingDays: {
    value: 250,
    label: "Clinic days per year",
    display: "250",
    source: "Five days a week, less holidays and closures.",
  },
  paidHoursPerFte: {
    value: 2080,
    label: "Paid hours per front desk FTE",
    display: "2,080",
    source: "Used only to cap the staff-time component — see below.",
  },
} as const;

export type CalcComponent = {
  key: "missed" | "staff" | "rework";
  label: string;
  amount: number;
  formula: string;
  note?: string;
};

export type CalcResult = {
  inputs: CalcInputs;
  components: CalcComponent[];
  total: number;
  /** Staff component as a share of the front desk's total paid hours. */
  staffShareOfPayroll: number;
  staffCapped: boolean;
  assumptions: typeof ASSUMPTIONS;
};

export function clampInputs(raw: Partial<CalcInputs>): CalcInputs {
  const n = (v: unknown, lo: number, hi: number, dflt: number) => {
    const x = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(x)) return dflt;
    return Math.min(hi, Math.max(lo, x));
  };
  return {
    patientsPerDay: Math.round(n(raw.patientsPerDay, 1, 500, 40)),
    noShowRate: n(raw.noShowRate, 0, 0.6, 0.12),
    frontDeskStaff: Math.round(n(raw.frontDeskStaff, 1, 100, 3)),
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
  // headcount input exists to enforce that ceiling — without it, a big practice
  // with a small desk produces a number that a CFO throws out on sight.
  const staffCap =
    inputs.frontDeskStaff * A.paidHoursPerFte.value * A.loadedHourlyRate.value;
  const staff = Math.min(staffRaw, staffCap);
  const staffCapped = staffRaw > staffCap;

  const rework = visitsPerYear * A.reworkRate.value * A.costToRework.value;

  const components: CalcComponent[] = [
    {
      key: "missed",
      label: "Missed visit revenue",
      amount: missed,
      formula: `${inputs.patientsPerDay} patients/day × ${pct(inputs.noShowRate)} no-show × ${A.workingDays.display} days × ${A.avgVisitRevenue.display}`,
      note: "Appointments that never happened. Reminders and pre-visit intake are what move this.",
    },
    {
      key: "staff",
      label: "Front desk time on manual entry",
      amount: staff,
      formula: `${A.minutesPerIntake.display} × ${inputs.patientsPerDay} patients/day × ${A.workingDays.display} days × ${A.loadedHourlyRate.display}`,
      note: staffCapped
        ? `Capped at ${inputs.frontDeskStaff} FTE of paid hours — the raw figure exceeded what your desk is paid for.`
        : "Hours your desk spends keying in what the patient already wrote down.",
    },
    {
      key: "rework",
      label: "Claim rework from intake errors",
      amount: rework,
      formula: `${inputs.patientsPerDay} patients/day × ${A.workingDays.display} days × ${A.reworkRate.display} × ${A.costToRework.display}`,
      note: "Denials traced back to a bad demographic or an unverified plan.",
    },
  ];

  return {
    inputs,
    components,
    total: components.reduce((s, c) => s + c.amount, 0),
    staffShareOfPayroll:
      staff / (inputs.frontDeskStaff * A.paidHoursPerFte.value * A.loadedHourlyRate.value),
    staffCapped,
    assumptions: A,
  };
}

/**
 * Role changes what gets read first, not what the number is.
 *
 * The brief asked for the calculator to be weighted by role. Weighting the
 * *total* by who is answering is the fastest way to earn the "sales toy" label
 * the calculator is supposed to avoid — two people at the same practice would
 * get two different answers and neither would trust either. So role reorders
 * the components and writes the lead line; the arithmetic is identical for
 * everyone. If you do want true coefficient weighting, this is the one place
 * to add it.
 */
export const ROLE_EMPHASIS: Record<
  string,
  { order: CalcComponent["key"][]; owns: CalcComponent["key"]; owner: string }
> = {
  billing: {
    order: ["rework", "missed", "staff"],
    owns: "rework",
    owner: "lands in your AR",
  },
  frontdesk: {
    order: ["staff", "missed", "rework"],
    owns: "staff",
    owner: "is hours at your desk",
  },
  owner: {
    order: ["missed", "rework", "staff"],
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
 * The one line under the headline figure.
 *
 * Built from the actual numbers rather than written in advance, because the
 * role's own component is often not the biggest one — telling an RCM lead that
 * "most of this lands in your AR" while the screen shows rework as the smallest
 * of three is exactly the kind of overclaim that loses the room. So we name
 * their slice honestly and point at the real driver when it is something else.
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
    return `${usd(mine.amount)} of it ${emphasis.owner} — the largest of the three.`;
  }
  return `${usd(mine.amount)} of it ${emphasis.owner}, about ${share}%. The bigger driver is ${biggest.label.toLowerCase()}.`;
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
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
