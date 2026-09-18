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
      "This is the unloaded median, which is what the data team's workbook uses. Loading it for payroll tax and benefits would put it nearer $28 and raise the staff line by a quarter. Ask them which they intended.",
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
      "An NIH-indexed study of a five-provider practice measured $19.60 per intake before automation and $14.70 after (S10).",
    internal:
      "Only the $4.90 delta is counted, not the $19.60 gross. The gross figure almost certainly contains front desk labour, which is already the staff line, and adding both would double count it. Worth confirming with the data team.",
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
    value: 32,
    label: "Patient responsibility per visit",
    display: "$32",
    status: "placeholder",
    source:
      "Average copay plus coinsurance and deductible owed by the patient on an office visit.",
    internal:
      "Ours. The workbook has no patient-collection driver at all, so this whole component is unsourced.",
  },
  writeOffRate: {
    value: 0.4,
    label: "Uncollected balance never recovered",
    display: "40%",
    status: "placeholder",
    source:
      "Share of balances not collected at the time of service that are eventually written off rather than recovered.",
    internal: "Ours. Needs a real write-off rate.",
  },
};

/**
 * The share of each component we claim to remove.
 *
 * Three of the five now come from the workbook. The other two are the two
 * components the workbook does not model at all, so they remain ours.
 */
export const RECOVERY: Record<CalcComponent["key"], Constant> = {
  missed: {
    value: 0.35,
    label: "No-shows recovered",
    display: "35%",
    status: "placeholder",
    source:
      "Share of no-shows avoided by pre-visit reminders, intake completed before arrival and waitlist backfill.",
    internal:
      "Ours, and the single most aggressive number left in the model. The data team's workbook has no no-show driver, which is itself worth asking about: they either could not source one or did not think we should claim it.",
  },
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
    value: 0.5,
    label: "Patient balance recovered",
    display: "50%",
    status: "placeholder",
    source:
      "Share of the currently uncollected balance captured when the ask happens on the phone before the visit rather than at the desk.",
    internal: "Ours. The workbook has no collection driver.",
  },
};

/**
 * The growth half. Money that never arrives, rather than money leaking out.
 */
export const GROWTH = {
  visitsPerNewPatient: {
    value: 2.4,
    label: "Visits from a new patient in year one",
    display: "2.4",
    status: "placeholder" as const,
    source:
      "A first visit plus the follow-ups it leads to, inside twelve months. Deliberately first-year only.",
    internal: "Ours. Needs a real figure off our own book.",
  },
  reviewUplift: {
    value: 0.08,
    label: "More new patients from a better review profile",
    display: "8%",
    status: "placeholder" as const,
    source:
      "Asking every patient for a review after the visit moves the rating and the count, which moves where you rank when somebody searches for a practice nearby.",
    internal:
      "Ours, and the softest number in the model. It chains through local search ranking, which we neither control nor measure.",
  },
  bookingUplift: {
    value: 0.12,
    label: "More new patients from online booking",
    display: "12%",
    status: "placeholder" as const,
    source:
      "Share of people who find you and then give up because booking means phoning during office hours.",
    internal: "Ours. Should be measurable from our own booking funnel.",
  },
  capacityConversion: {
    value: 0.3,
    label: "Freed front desk time that becomes new appointments",
    display: "30%",
    status: "sourced" as const,
    source:
      "The data team's workbook converts 30% of freed staff time into additional visits at half an hour each. Their own note calls this a ceiling rather than a promise.",
    internal:
      "Implemented as given, but flag it: freed FRONT DESK hours do not create PROVIDER capacity, and the constraint on seeing more patients is the provider. This is the line most likely to be challenged, and their README already says to present it as a ceiling.",
  },
  minutesPerAppointment: {
    value: 30,
    label: "Provider time per additional appointment",
    display: "30 min",
    status: "sourced" as const,
    source: "Half an hour a visit, from the data team's workbook.",
  },
};

export type CalcComponent = {
  key: "missed" | "staff" | "denials" | "admin" | "collection";
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
  // Only the visits that happen generate a claim, a form or a balance.
  const keptVisits = visitsPerYear * (1 - inputs.noShowRate);

  const missed = visitsPerYear * inputs.noShowRate * A.avgVisitRevenue.value;

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
      key: "missed",
      label: "Missed visit revenue",
      amount: missed,
      formula: `${inputs.patientsPerDay}/day × ${A.workingDays.display} days × ${pct(inputs.noShowRate)} no-show × ${A.avgVisitRevenue.display}`,
      note: "Appointments that never happened. Reminders and intake finished before arrival are what move this.",
    },
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

export type GrowthResult = {
  lines: ValueLine[];
  total: number;
  newPatientValue: number;
  /** True when there is nothing here to win. */
  alreadyDoing: boolean;
};

/**
 * Money that never arrives.
 *
 * Three lines. The capacity one is the data team's, and it is the largest and
 * the shakiest: it converts freed FRONT DESK hours into PROVIDER appointments,
 * and the constraint on seeing more patients is the provider. Their own note
 * calls it a ceiling rather than a promise, and the screen says so.
 *
 * The two reach lines are only counted where there is a gap. A practice that
 * already asks for reviews and already takes bookings online gets neither, and
 * is told so, which is the whole reason the number is worth reading when it is
 * not zero.
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

  const { hoursFreed } = recovery(result);
  const extraAppointments =
    (hoursFreed * GROWTH.capacityConversion.value) /
    (GROWTH.minutesPerAppointment.value / 60);
  if (extraAppointments >= 1) {
    lines.push({
      key: "capacity",
      label: "Appointments you'd have room for",
      basis: `${Math.round(hoursFreed).toLocaleString("en-US")} front desk hrs freed × ${GROWTH.capacityConversion.display} ÷ ${GROWTH.minutesPerAppointment.display} × ${A.avgVisitRevenue.display}`,
      amount: extraAppointments * A.avgVisitRevenue.value,
    });
  }

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

export const ROLE_EMPHASIS: Record<
  string,
  { order: CalcComponent["key"][]; owns: CalcComponent["key"]; owner: string }
> = {
  billing: {
    order: ["denials", "collection", "missed", "staff", "admin"],
    owns: "denials",
    owner: "lands in your AR",
  },
  frontdesk: {
    order: ["staff", "admin", "missed", "collection", "denials"],
    owns: "staff",
    owner: "is hours at your desk",
  },
  owner: {
    order: ["missed", "collection", "staff", "admin", "denials"],
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
    return `${usd(mine.amount)} of it ${emphasis.owner}, the largest of the five.`;
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
