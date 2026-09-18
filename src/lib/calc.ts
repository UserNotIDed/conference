/**
 * The money model: what intake is leaking, and what fixing it is worth.
 *
 *   calculate()  the leak. Five components of annual loss, summed.
 *   recovery()   the share of each one we claim to remove.
 *   growth()     money that never arrives at all, kept separate on purpose.
 *
 * Most of the constants now come from the data team's benchmark workbook
 * (September 2026), which cites MGMA, BLS, HFMA and NIH-indexed studies. Those
 * carry `status: "sourced"` and name the source key from the Sources tab.
 * Everything still marked `placeholder` is ours and is listed in CRITERIA.md.
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
  /**
   * Providers in the practice.
   *
   * Nothing in the arithmetic uses it. It is here because Yosi bills per
   * provider per month, which makes it the one answer that sizes the deal, and
   * because the data team's benchmarks are all expressed per provider per day,
   * so it is what lets their table be checked against a real practice. It
   * reaches HubSpot and stops there.
   */
  providers: number;
};

type Constant = {
  value: number;
  label: string;
  display: string;
  status: "sourced" | "placeholder";
  /** Shown to the prospect, on their phone, next to the number. */
  source: string;
  /**
   * Never rendered. What still has to happen before this number is defensible,
   * for CRITERIA.md and for whoever picks this up after the show.
   */
  internal?: string;
};

/**
 * The data team's specialty table, verbatim.
 *
 * Only Women's Health is used: this is a women's health show and a specialty
 * picker would be a screen nobody needs. The rest of the table is here because
 * the work was done and because taking this to a different show should be a
 * one-line change rather than a research project.
 */
export const SPECIALTIES = {
  "Women's Health": { revenuePerVisit: 250, patientsPerProviderDay: 20, denialRate: 0.08 },
  "OB/GYN": { revenuePerVisit: 250, patientsPerProviderDay: 20, denialRate: 0.08 },
  "Primary Care": { revenuePerVisit: 175, patientsPerProviderDay: 22, denialRate: 0.08 },
  Pediatrics: { revenuePerVisit: 140, patientsPerProviderDay: 25, denialRate: 0.08 },
  "Urgent Care": { revenuePerVisit: 200, patientsPerProviderDay: 35, denialRate: 0.08 },
  "Behavioral Health": { revenuePerVisit: 175, patientsPerProviderDay: 10, denialRate: 0.08 },
  "Mental Health": { revenuePerVisit: 175, patientsPerProviderDay: 12, denialRate: 0.08 },
  Orthopedics: { revenuePerVisit: 400, patientsPerProviderDay: 20, denialRate: 0.1 },
  "General / Not Sure": {
    revenuePerVisit: 215.56,
    patientsPerProviderDay: 20.67,
    denialRate: 0.0822,
  },
} as const;

export const SPECIALTY = SPECIALTIES["Women's Health"];

/** Inputs to the leak. What a practice loses today. */
export const ASSUMPTIONS: Record<string, Constant> = {
  avgVisitRevenue: {
    value: SPECIALTY.revenuePerVisit,
    label: "Revenue per completed visit",
    display: "$250",
    status: "sourced",
    source:
      "Average revenue per visit for women's health, from the MGMA financials and operations benchmarks (S1, S8).",
  },
  minutesPerIntakeToday: {
    value: 17,
    label: "Front desk minutes per patient on registration today",
    display: "17 min",
    status: "sourced",
    source:
      "Paper and clipboard intake measured at 15 to 20 minutes per patient in NIH-indexed time studies; the midpoint is used (S5).",
  },
  minutesSaved: {
    value: 12,
    label: "Of which digital intake removes",
    display: "12 min",
    status: "sourced",
    source:
      "Digital intake completes in under 3 minutes against 15 to 20 on paper. The benchmark delta for women's health is 12 minutes (S5).",
  },
  staffHoursSavedPerFteWeek: {
    value: 12,
    label: "Ceiling on hours saved per front desk person per week",
    display: "12 hrs",
    status: "sourced",
    source:
      "Case studies at Intermountain, Penn Medicine and Mayo report 10 to 15 hours a week per front desk FTE from automating data entry, insurance verification and form scanning (S5).",
    internal:
      "Used as a cap rather than as the driver. The per-patient figure scales with volume, which the per-FTE figure does not; capping one with the other keeps a high-volume practice honest and a low-volume one from claiming hours it does not have.",
  },
  frontDeskHourlyRate: {
    value: 22,
    label: "Front desk hourly rate",
    display: "$22/hr",
    status: "sourced",
    source:
      "BLS 2024 median wage for medical secretaries and administrative assistants (S7).",
    internal:
      "The unloaded BLS median, as the workbook uses it. Settled: we stay unloaded. Loading for payroll tax and benefits would put it near $28 and raise the staff line by about a quarter, so this is the conservative reading.",
  },
  denialRate: {
    value: SPECIALTY.denialRate,
    label: "First-pass claim denial rate",
    display: "8%",
    status: "sourced",
    source: "MGMA DataDive Practice Operations, single-specialty aggregate (S1).",
  },
  frontEndDenialShare: {
    value: 0.27,
    label: "Denials that start at registration",
    display: "27%",
    status: "sourced",
    source:
      "Share of denials originating in registration and eligibility errors, MGMA via Change Healthcare. 86% of denials are preventable (S2).",
  },
  costToRework: {
    value: 25,
    label: "Cost to rework one denied claim",
    display: "$25",
    status: "sourced",
    source:
      "MGMA benchmark, also cited by the AMA and HFMA. Change Healthcare puts it as high as $118 with overhead; the conservative figure is used (S3).",
  },
  adminCostPerIntake: {
    value: 4.9,
    label: "Paper and admin cost per intake that automation removes",
    display: "$4.90",
    status: "sourced",
    source:
      "An NIH-indexed study of a five-provider practice measured $19.60 per intake before automation and $14.70 after. The $4.90 difference is the saving (S10).",
    internal:
      "This is the data team's driver 3 at full weight: their workbook uses the $4.90 delta, not the $19.60 gross, and so do we. Counting the gross would double count front desk labour, which is already the staff line. Nothing is being held back here.",
  },
  workingDays: {
    value: 264,
    label: "Clinic days a year",
    display: "264",
    status: "sourced",
    source: "22 clinic days a month, from the data team's workbook.",
    internal:
      "264 assumes no closures at all. Our own figure was 250. Theirs is used for consistency; it makes every annual number about 6% larger.",
  },
  patientResponsibility: {
    value: 30,
    label: "Patient responsibility per visit",
    display: "$30",
    status: "placeholder",
    source:
      "What the patient owes at an office visit. Employer-plan copays for a specialist visit sit in the $30 to $45 range and primary care lower; we use a figure at the bottom of that and ignore coinsurance and deductibles entirely, so the real number is higher.",
    internal:
      "Our estimate. The workbook has no patient-collection driver. Deliberately set below typical specialist copays so the component under-reads rather than over-reads.",
  },
  writeOffRate: {
    value: 0.3,
    label: "Uncollected balance never recovered",
    display: "30%",
    status: "placeholder",
    source:
      "Once a patient has left, the balance gets harder to collect with every week that passes. This is the share that is eventually written off rather than recovered by statements or collections.",
    internal:
      "Our estimate, and deliberately conservative: the commonly quoted figures for patient balances that go uncollected are higher than this.",
  },
};

/**
 * The share of each component we claim to remove.
 *
 * Three of the five now come from the workbook. The other two are the two
 * components the workbook does not model at all, so they remain ours.
 */
export const RECOVERY: Record<CalcComponent["key"], Constant> = {
  staff: {
    value: 12 / 17,
    label: "Registration time removed",
    display: "71%",
    status: "sourced",
    source:
      "12 of the 17 minutes a paper intake takes are removed when the patient completes it before arrival and it writes back to the chart (S5).",
  },
  denials: {
    value: 0.7,
    label: "Registration denials avoided",
    display: "70%",
    status: "sourced",
    source:
      "Reduction in registration-driven denials from verifying eligibility before the visit. The data team's workbook uses 70%; Deloitte puts automated claim scrubbing as high as 85% (S9).",
  },
  admin: {
    value: 1,
    label: "Paper and admin cost removed",
    display: "100%",
    status: "sourced",
    source:
      "The $4.90 is already the measured before-and-after difference, so all of it is the saving (S10).",
  },
  collection: {
    value: 0.4,
    label: "Patient balance recovered",
    display: "40%",
    status: "placeholder",
    source:
      "Share of the currently uncollected balance captured when the ask happens on the phone before the visit, rather than at a desk with a queue behind it.",
    internal:
      "Our estimate, down from 50%. The workbook has no collection driver.",
  },
};

/**
 * What else is on the table.
 *
 * No dollar figures here any more, on purpose.
 *
 * There were three: a conversion of freed front desk hours into provider
 * appointments, and two for reviews and online booking. The first turned
 * reception time into clinical capacity, which is not how a clinic is
 * constrained, and the workbook's own note called it a ceiling rather than a
 * promise. The other two chained through local search ranking, which we
 * neither control nor measure. All three were the biggest numbers on the
 * screen and the easiest to argue with, which is the worst combination a
 * booth can have.
 *
 * What is left is the hours, which are measured, and the two gaps, which are
 * facts about their practice rather than claims about ours. A named
 * opportunity with no price on it survives scrutiny; a large invented number
 * takes the sourced ones down with it.
 */
export const GROWTH = {
  staffHoursNote: {
    value: 0,
    label: "Freed front desk hours",
    display: "hours, not dollars",
    status: "sourced" as const,
    source:
      "We report the hours the desk gets back and stop there. What a practice does with them, whether that is more appointments, shorter queues or going home on time, is their call and not a number we should be putting on their screen.",
  },
};

export type CalcComponent = {
  key: "staff" | "denials" | "admin" | "collection";
  label: string;
  amount: number;
  formula: string;
  note?: string;
};

export type CalcResult = {
  inputs: CalcInputs;
  visitsPerYear: number;
  keptVisits: number;
  components: CalcComponent[];
  total: number;
  assumptions: typeof ASSUMPTIONS;
};

export const INPUT_DEFAULTS: CalcInputs = {
  patientsPerDay: 40,
  noShowRate: 0.12,
  frontDeskStaff: 3,
  collectedRate: 0.6,
  newPatientsPerMonth: 30,
  providers: 4,
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
    providers: Math.round(n(raw.providers, 1, 200, d.providers)),
  };
}

export function calculate(rawInputs: Partial<CalcInputs>): CalcResult {
  const inputs = clampInputs(rawInputs);
  const A = ASSUMPTIONS;
  const visitsPerYear = inputs.patientsPerDay * A.workingDays.value;
  // Only the visits that happen generate a claim, a form or a balance.
  const keptVisits = visitsPerYear * (1 - inputs.noShowRate);

  const staff =
    (A.minutesPerIntakeToday.value / 60) *
    keptVisits *
    A.frontDeskHourlyRate.value;

  const denials =
    keptVisits *
    A.denialRate.value *
    A.frontEndDenialShare.value *
    A.costToRework.value;

  const admin = keptVisits * A.adminCostPerIntake.value;

  const owed = keptVisits * A.patientResponsibility.value;
  const collection = owed * (1 - inputs.collectedRate) * A.writeOffRate.value;

  const visits = Math.round(keptVisits).toLocaleString("en-US");

  const components: CalcComponent[] = [
    {
      key: "staff",
      label: "Front desk time on registration",
      amount: staff,
      formula: `${A.minutesPerIntakeToday.display} × ${visits} visits × ${A.frontDeskHourlyRate.display}`,
      note: "Hours your desk spends checking patients in and keying in what they already wrote down.",
    },
    {
      key: "admin",
      label: "Paper, printing and scanning",
      amount: admin,
      formula: `${visits} visits × ${A.adminCostPerIntake.display}`,
      note: "The measured difference between running an intake on paper and running it digitally.",
    },
    {
      key: "collection",
      label: "Patient balances written off",
      amount: collection,
      formula: `${visits} visits × ${A.patientResponsibility.display} × ${pct(1 - inputs.collectedRate)} uncollected × ${A.writeOffRate.display}`,
      note: "What is owed at the desk, not collected at the desk, and never recovered.",
    },
    {
      key: "denials",
      label: "Claim rework from registration errors",
      amount: denials,
      formula: `${visits} claims × ${A.denialRate.display} denied × ${A.frontEndDenialShare.display} from registration × ${A.costToRework.display}`,
      note: "Denials traced back to a bad demographic or an unverified plan.",
    },
  ];

  return {
    inputs,
    visitsPerYear,
    keptVisits,
    components,
    total: components.reduce((s, c) => s + c.amount, 0),
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
// with a number in front of you, not a variable to bury inside one.
// ---------------------------------------------------------------------------

export type ValueLine = {
  key: string;
  label: string;
  basis: string;
  amount: number;
  capped?: boolean;
};

export type RecoveryResult = {
  lines: ValueLine[];
  total: number;
  /** Front desk hours a year the staff line actually frees. */
  hoursFreed: number;
  staffCapped: boolean;
};

export function recovery(result: CalcResult): RecoveryResult {
  const A = ASSUMPTIONS;
  const { inputs, keptVisits } = result;

  // The per-patient figure scales with volume; the per-FTE ceiling does not.
  // Capping one with the other stops a high-volume practice from claiming more
  // hours than its desk works, which is the first thing a CFO checks.
  const rawHours = (A.minutesSaved.value / 60) * keptVisits;
  const capHours =
    A.staffHoursSavedPerFteWeek.value * 52 * inputs.frontDeskStaff;
  const hoursFreed = Math.min(rawHours, capHours);
  const staffCapped = rawHours > capHours;

  const lines: ValueLine[] = result.components.map((c) => {
    if (c.key === "staff") {
      return {
        key: c.key,
        label: RECOVERY.staff.label,
        basis: staffCapped
          ? `${Math.round(hoursFreed).toLocaleString("en-US")} hrs, capped at ${A.staffHoursSavedPerFteWeek.display}/week for ${inputs.frontDeskStaff} people`
          : `${A.minutesSaved.display} of ${A.minutesPerIntakeToday.display} per patient`,
        amount: hoursFreed * A.frontDeskHourlyRate.value,
        capped: staffCapped,
      };
    }
    return {
      key: c.key,
      label: RECOVERY[c.key].label,
      basis: `${pct(RECOVERY[c.key].value)} of ${usd(c.amount)}`,
      amount: c.amount * RECOVERY[c.key].value,
    };
  });

  return {
    lines,
    total: lines.reduce((s, l) => s + l.amount, 0),
    hoursFreed,
    staffCapped,
  };
}

export type GrowthContext = {
  /** Patients can book without phoning during office hours. */
  onlineBooking?: boolean;
  /** Every patient is asked for a review after the visit. */
  asksForReviews?: boolean;
};

export type GrowthOpportunity = {
  key: string;
  label: string;
  note: string;
  /** Some are worth a figure. None of them is a claim about what we recover. */
  amount?: number;
  basis?: string;
};

export type GrowthResult = {
  /** Front desk hours a year the recovery frees up. Measured, not converted. */
  hoursFreed: number;
  /** Named, unpriced. */
  opportunities: GrowthOpportunity[];
  /** True when there is nothing here to win. */
  alreadyDoing: boolean;
};

/**
 * The two gaps, named and not priced.
 *
 * Only counted where there is one. A practice that already asks for reviews
 * and already takes bookings online gets neither and is told so, which is the
 * whole reason the section is worth reading when it is not empty.
 */
export function growth(
  result: CalcResult,
  ctx: GrowthContext = {},
): GrowthResult {
  const A = ASSUMPTIONS;
  const { inputs, visitsPerYear } = result;
  const opportunities: GrowthOpportunity[] = [];

  /**
   * No-shows. Costed, deliberately not claimed.
   *
   * This used to be a leak component with a 20% recovery rate on it, and it
   * was two thirds of the leak, which meant the headline was dominated by the
   * one thing we could evidence least. Taking it out lifted the capture ratio
   * from about a third to about seventy per cent and left every remaining
   * line benchmarked.
   *
   * It is still here because it is the largest number in the practice and
   * because reminders and scheduling are exactly what move it. What changed is
   * that we state the cost, which is arithmetic on their own no-show rate, and
   * say nothing about the share we would take off it. The cost is not
   * arguable. A recovery rate would have been.
   */
  const noShowCost =
    visitsPerYear * inputs.noShowRate * A.avgVisitRevenue.value;
  if (noShowCost > 0) {
    opportunities.push({
      key: "noshow",
      label: "Patients who do not turn up",
      amount: noShowCost,
      basis: `${inputs.patientsPerDay}/day × ${A.workingDays.display} days × ${pct(inputs.noShowRate)} no-show × ${A.avgVisitRevenue.display}`,
      note: "Not counted in either figure above. Reminders and scheduling are what move a no-show rate, and we would rather show you the cost than guess at the share of it we would take off. It is the easiest number on this page for you to check yourself.",
    });
  }

  if (!ctx.asksForReviews) {
    opportunities.push({
      key: "reviews",
      label: "Nobody is asking your patients for a review",
      note: "A survey after every visit puts the happy ones on Google. It costs the practice nothing and it is the single easiest thing on this list to switch on.",
    });
  }
  if (!ctx.onlineBooking) {
    opportunities.push({
      key: "booking",
      label: "Booking still means phoning you",
      note: "People who find you outside office hours, or who would rather not phone at all, are the ones you never hear from.",
    });
  }
  return {
    hoursFreed: recovery(result).hoursFreed,
    opportunities,
    alreadyDoing: opportunities.length === 0,
  };
}

export const ROLE_EMPHASIS: Record<
  string,
  { order: CalcComponent["key"][]; owns: CalcComponent["key"]; owner: string }
> = {
  billing: {
    order: ["denials", "collection", "staff", "admin"],
    owns: "denials",
    owner: "lands in your AR",
  },
  frontdesk: {
    order: ["staff", "admin", "collection", "denials"],
    owns: "staff",
    owner: "is hours at your desk",
  },
  owner: {
    order: ["collection", "staff", "admin", "denials"],
    owns: "collection",
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
