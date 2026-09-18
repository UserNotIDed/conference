/**
 * The HubSpot contact mapping. One file, three jobs.
 *
 *   1. PROPERTIES is the spec. Create these on the Contact object in HubSpot,
 *      exactly these internal names. /admin renders it as a checklist.
 *   2. contactProperties() builds the payload we POST. /admin shows the real
 *      payload per lead, so what you see there is what HubSpot gets.
 *   3. The CSV export uses the same internal names, so a failed submit is
 *      recoverable by importing the file, with the same columns either way.
 *
 * Keeping all three in one place is the point. The usual way this goes wrong
 * is a property renamed in HubSpot, a payload key that still says the old
 * thing, and a column silently dropping on every lead for two days.
 *
 * ── How the connection works ─────────────────────────────────────────────────
 * The microsite POSTs, server-side, to the Forms API:
 *
 *   POST https://api.hsforms.com/submissions/v3/integration/submit/{portal}/{guid}
 *
 * No SDK, no OAuth, no private app token: the endpoint is public by design and
 * the form GUID is the credential. HubSpot dedupes on email, so the same person
 * submitting twice updates one contact rather than making two. A submission can
 * kick off a workflow, which is how the email goes out without us sending mail.
 *
 * Server-side rather than from the browser because ad blockers eat HubSpot's
 * client script, conference wifi eats third-party requests, and a failed lead
 * capture at a booth is a lead you never knew you had.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Row } from "./rows";
import { ASSUMPTIONS, calculate, clampInputs, growth, recovery } from "./calc";
import { score } from "./score";
import { ROLES } from "./demo";
import { SATISFACTION } from "./tech-stack";
import { EMPTY } from "./display";

export const PORTAL_ID = process.env.HUBSPOT_PORTAL_ID ?? "45713988";

/**
 * Two forms, not one, so the email that carries the diagnosis cannot fire
 * before there is a diagnosis to carry. `lead` submits the moment section 1 is
 * answered, which is the lead captured even if they walk off. `diagnosis`
 * submits when the score and the money land, and is the one the email workflow
 * listens to.
 */
export const FORMS = {
  lead: process.env.HUBSPOT_FORM_LEAD ?? "",
  diagnosis: process.env.HUBSPOT_FORM_DIAGNOSIS ?? "",
} as const;

export function submitUrl(formGuid: string): string {
  return `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${formGuid}`;
}

export type PropertyType =
  | "string"
  | "number"
  | "enumeration"
  | "bool"
  | "datetime";

export type PropertyDef = {
  /** The internal name. This is the contract, so never rename it in HubSpot. */
  name: string;
  label: string;
  type: PropertyType;
  /** Which submission carries it. */
  form: "lead" | "diagnosis";
  options?: readonly string[];
  /** Why it is worth a column. Shown in /admin. */
  note: string;
  /** Already exists on every HubSpot portal, so do not create it. */
  standard?: boolean;
};

export const PROPERTIES: PropertyDef[] = [
  // --- Standard contact properties. Already there. -------------------------
  {
    name: "email",
    label: "Email",
    type: "string",
    form: "lead",
    standard: true,
    note: "The dedupe key. Everything else hangs off it.",
  },
  {
    name: "firstname",
    label: "First name",
    type: "string",
    form: "lead",
    standard: true,
    note: "Split from the single name field they typed.",
  },
  {
    name: "lastname",
    label: "Last name",
    type: "string",
    form: "lead",
    standard: true,
    note: "Everything after the first space.",
  },
  {
    name: "company",
    label: "Company name",
    type: "string",
    form: "lead",
    standard: true,
    note: "Their practice.",
  },
  {
    name: "address",
    label: "Street address",
    type: "string",
    form: "lead",
    standard: true,
    note: "Street and unit joined. Optional, so expect it empty on most.",
  },
  { name: "city", label: "City", type: "string", form: "lead", standard: true, note: "" },
  { name: "state", label: "State", type: "string", form: "lead", standard: true, note: "" },
  { name: "zip", label: "Postal code", type: "string", form: "lead", standard: true, note: "" },

  // --- Ours. Create these. -------------------------------------------------
  {
    name: "booth_event",
    label: "Booth: event",
    type: "string",
    form: "lead",
    note: "Which show. Set from an env var so the same build serves the next one.",
  },
  {
    name: "booth_role",
    label: "Booth: seat at the practice",
    type: "enumeration",
    form: "lead",
    options: [...ROLES.map((r) => r.label), "Something else"],
    note: "Decides which leak component the follow-up leads with.",
  },
  {
    name: "booth_role_other",
    label: "Booth: seat, free text",
    type: "string",
    form: "lead",
    note: "Only when they picked Something else. Worth reading after the show.",
  },
  {
    name: "booth_tech_stack",
    label: "Booth: tech stack",
    type: "string",
    form: "diagnosis",
    note: "Everything they selected, semicolon separated. Keep as text, because a multi-select needs every option defined up front and the list grows.",
  },
  {
    name: "booth_ehr",
    label: "Booth: EHR",
    type: "string",
    form: "diagnosis",
    note: "Pulled out of the stack so it can be a filter on its own.",
  },
  {
    name: "booth_incumbent",
    label: "Booth: intake vendor in place",
    type: "string",
    form: "diagnosis",
    note: "Who we would be displacing. Empty means greenfield.",
  },
  {
    name: "booth_intake_satisfaction",
    label: "Booth: how intake is working out",
    type: "enumeration",
    form: "diagnosis",
    options: SATISFACTION,
    note: "Asked of everyone, about whatever they run today. The hottest segment in the export is \"actively looking to change it\". Build a list on this alone.",
  },
  {
    name: "booth_pain_points",
    label: "Booth: what costs them time",
    type: "string",
    form: "diagnosis",
    note: "Their own words for what breaks, semicolon separated. Does not move the score; it is the opening line for the call.",
  },
  {
    name: "booth_patients_per_day",
    label: "Booth: patients per day",
    type: "number",
    form: "diagnosis",
    note: "Sizes the account as well as the leak.",
  },
  {
    name: "booth_no_show_rate",
    label: "Booth: no-show rate (%)",
    type: "number",
    form: "diagnosis",
    note: "Stored as a whole number, so 14 not 0.14. HubSpot has no percent type.",
  },
  {
    name: "booth_front_desk_fte",
    label: "Booth: front desk headcount",
    type: "number",
    form: "diagnosis",
    note: "Caps the staff-time component.",
  },
  {
    name: "booth_collected_up_front",
    label: "Booth: patient balance collected up front (%)",
    type: "number",
    form: "diagnosis",
    note: "Whole number. Drives the write-off component and a fifth of the score.",
  },
  {
    name: "booth_health_score",
    label: "Booth: practice health score",
    type: "number",
    form: "diagnosis",
    note: "0–100. The one number to sort the whole list by.",
  },
  {
    name: "booth_health_band",
    label: "Booth: practice health band",
    type: "enumeration",
    form: "diagnosis",
    options: ["Healthy", "Holding", "Under strain", "At risk"],
    note: "The word on the screen. Segment on it rather than on score ranges.",
  },
  {
    name: "booth_biggest_gap",
    label: "Booth: most to gain",
    type: "string",
    form: "diagnosis",
    note: "The dimension with the most score available. The email's subject line.",
  },
  {
    name: "booth_annual_leak",
    label: "Booth: estimated annual leak ($)",
    type: "number",
    form: "diagnosis",
    note: "What we told them. Put it in the email and bring it to the call.",
  },
  {
    name: "booth_leak_missed",
    label: "Booth: leak: missed visit revenue ($)",
    type: "number",
    form: "diagnosis",
    note: "The four components stored separately so the follow-up email can show the breakdown without us computing anything at send time.",
  },
  {
    name: "booth_leak_staff",
    label: "Booth: leak: front desk time ($)",
    type: "number",
    form: "diagnosis",
    note: "Also the best single field to segment on: a big number here is an operations conversation.",
  },
  {
    name: "booth_leak_denials",
    label: "Booth: leak: registration denials ($)",
    type: "number",
    form: "diagnosis",
    note: "",
  },
  {
    name: "booth_leak_admin",
    label: "Booth: leak: paper and admin ($)",
    type: "number",
    form: "diagnosis",
    note: "",
  },
  {
    name: "booth_leak_collection",
    label: "Booth: leak: balances written off ($)",
    type: "number",
    form: "diagnosis",
    note: "",
  },
  {
    name: "booth_annual_recovery",
    label: "Booth: recoverable from the leak ($)",
    type: "number",
    form: "diagnosis",
    note: "The share of the leak we claim to recover. Nothing is netted off for price; that conversation happens with a human.",
  },
  {
    name: "booth_hours_freed",
    label: "Booth: front desk hours freed a year",
    type: "number",
    form: "diagnosis",
    note: "Measured, not converted into revenue. Often the line that lands hardest with an operations buyer.",
  },
  {
    name: "booth_new_patients_per_month",
    label: "Booth: new patients a month",
    type: "number",
    form: "diagnosis",
    note: "Sizes the growth half, and is the single best proxy for how fast the practice is moving.",
  },
  {
    name: "booth_online_booking",
    label: "Booth: patients can book online",
    type: "bool",
    form: "diagnosis",
    note: "False is a scheduling conversation. Pair it with the next one for the whole growth pitch.",
  },
  {
    name: "booth_asks_for_reviews",
    label: "Booth: asks for a review after the visit",
    type: "bool",
    form: "diagnosis",
    note: "False is the easiest thing we switch on and the one with the longest tail.",
  },
  {
    name: "booth_benchmark_optin",
    label: "Booth: wants the benchmark",
    type: "bool",
    form: "diagnosis",
    note: "Pre-ticked, so a false here is a deliberate untick. Treat it as one.",
  },
  {
    name: "booth_booking_clicked",
    label: "Booth: opened the scheduler",
    type: "bool",
    form: "diagnosis",
    note: "False plus a finished diagnosis is the retarget list. That is the list that matters.",
  },
];

export const BOOTH_EVENT = process.env.NEXT_PUBLIC_BOOTH_EVENT ?? "USWHA 2026";

function splitName(full: string | null): [string, string] {
  const parts = (full ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return ["", ""];
  if (parts.length === 1) return [parts[0], ""];
  return [parts[0], parts.slice(1).join(" ")];
}

/**
 * One session, as HubSpot will store it.
 *
 * Returns strings throughout, because the Forms API takes `{name, value}` pairs and
 * coerces on its side, and sending a JavaScript number here is how a 0 becomes
 * an empty cell. Keys are omitted rather than sent empty when we genuinely have
 * no answer, so a later submission cannot blank a field the earlier one filled.
 */
export function contactProperties(
  row: Row,
  which: "lead" | "diagnosis" | "all" = "all",
): Record<string, string> {
  const out: Record<string, string> = {};
  const put = (k: string, v: string | number | boolean | null | undefined) => {
    if (v === null || v === undefined || v === "") return;
    out[k] = typeof v === "boolean" ? String(v) : String(v);
  };

  const wants = (form: "lead" | "diagnosis") => which === "all" || which === form;

  if (wants("lead")) {
    const [first, last] = splitName(row.captureName);
    put("email", row.captureEmail);
    put("firstname", first);
    put("lastname", last);
    put("company", row.capturePractice);
    put(
      "address",
      [row.captureStreet, row.captureUnit].filter(Boolean).join(", ") || null,
    );
    put("city", row.captureCity);
    put("state", row.captureState);
    put("zip", row.captureZip);
    put("booth_event", BOOTH_EVENT);
    put("booth_role", row.roleLabel === EMPTY ? null : row.roleLabel);
    put("booth_role_other", row.roleOther);
  }

  if (wants("diagnosis")) {
    put("booth_tech_stack", row.techStack.join("; ") || null);
    put("booth_ehr", row.ehrSystem);
    put("booth_incumbent", row.competitorTool);
    put("booth_intake_satisfaction", row.intakeSatisfaction);
    put("booth_pain_points", row.painPoints.join("; ") || null);

    if (row.calcInputs) {
      const inputs = clampInputs(row.calcInputs);
      const money = calculate(inputs);
      const back = recovery(money);
      const upside = growth(money, {
        onlineBooking: row.onlineBooking,
        asksForReviews: row.asksForReviews,
      });
      const health = score({
        inputs,
        techStack: row.techStack,
        intakeSatisfaction: row.intakeSatisfaction,
        onlineBooking: row.onlineBooking,
        asksForReviews: row.asksForReviews,
      });
      put("booth_patients_per_day", inputs.patientsPerDay);
      put("booth_no_show_rate", Math.round(inputs.noShowRate * 100));
      put("booth_front_desk_fte", inputs.frontDeskStaff);
      put("booth_collected_up_front", Math.round(inputs.collectedRate * 100));
      put("booth_new_patients_per_month", inputs.newPatientsPerMonth);
      put("booth_health_score", health.total);
      put("booth_health_band", health.band.label);
      put("booth_biggest_gap", biggestGapLabel(row));
      for (const c of money.components) {
        put(`booth_leak_${c.key}`, Math.round(c.amount));
      }
      put("booth_annual_leak", Math.round(money.total));
      put("booth_annual_recovery", Math.round(back.total));
      put("booth_hours_freed", Math.round(upside.hoursFreed));
    }

    // Written whether true or false: a pre-ticked box that never reaches the
    // record reads as declined, which is the opposite of what happened.
    if (row.captureOptIn !== null && row.captureOptIn !== undefined) {
      out.booth_benchmark_optin = String(Boolean(row.captureOptIn));
    }
    out.booth_online_booking = String(Boolean(row.onlineBooking));
    out.booth_asks_for_reviews = String(Boolean(row.asksForReviews));
    out.booth_booking_clicked = String(Boolean(row.bookedAt));
  }

  return out;
}

function biggestGapLabel(row: Row): string | null {
  if (!row.calcInputs) return null;
  const health = score({
    inputs: clampInputs(row.calcInputs),
    techStack: row.techStack,
    intakeSatisfaction: row.intakeSatisfaction,
    onlineBooking: row.onlineBooking,
    asksForReviews: row.asksForReviews,
  });
  return [...health.dimensions].sort(
    (a, b) => (100 - b.value) * b.weight - (100 - a.value) * a.weight,
  )[0].label;
}

/** The Forms API body. Exported so /admin can show exactly what we send. */
export function formPayload(row: Row, which: "lead" | "diagnosis") {
  return {
    fields: Object.entries(contactProperties(row, which)).map(([name, value]) => ({
      objectTypeId: "0-1", // contact
      name,
      value,
    })),
    context: { pageUri: "booth", pageName: "Practice health check" },
  };
}

/** Column order for the CSV, so the file imports straight onto these fields. */
export const CSV_HEADERS = PROPERTIES.map((p) => p.name);

export function csvRow(row: Row): string[] {
  const props = contactProperties(row, "all");
  return CSV_HEADERS.map((h) => props[h] ?? "");
}

/** The one assumption the follow-up email has to restate. */
export const LOCKED_MINUTES = ASSUMPTIONS.minutesPerIntakeToday.display;
