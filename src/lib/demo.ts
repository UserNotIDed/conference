import { EMPTY } from "./display";

/**
 * The demo tenant. Everything here is synthetic: the practice does not exist,
 * the patients are invented, phone numbers use the 555-01xx reserved range and
 * the member ID is made up. No PHI is or has ever been in this codebase.
 */

export const PRACTICE = {
  name: "Lakeview Women's Health",
  short: "Lakeview",
  phone: "+12145550148",
} as const;

export type Persona = {
  legalName: string;
  dob: string; // MM/DD/YYYY
  email: string;
  provider: string;
  reason: string;
  appointment: string;
};

/**
 * Attendees role-play a patient. Rotating the roster rather than making
 * everyone Maria is what makes /staff read like an actual front desk queue
 * instead of twenty copies of one row, which is the whole point of that
 * screen. Maria stays first so the scripted walkthrough matches the mockup.
 */
export const PERSONAS: Persona[] = [
  {
    legalName: "Maria Alvarez",
    dob: "03/14/1988",
    email: "m.alvarez@example.com",
    provider: "Dr. Amara Osei, MD",
    reason: "Annual well-woman exam",
    appointment: "Today, 11:15 AM",
  },
  {
    legalName: "Danielle Okonkwo",
    dob: "07/02/1991",
    email: "d.okonkwo@example.com",
    provider: "Dr. Priya Raghunathan, DO",
    reason: "Follow-up, lab review",
    appointment: "Today, 11:30 AM",
  },
  {
    legalName: "Sarah Lindqvist",
    dob: "11/23/1979",
    email: "s.lindqvist@example.com",
    provider: "Dr. Amara Osei, MD",
    reason: "Prenatal, 24 weeks",
    appointment: "Today, 11:45 AM",
  },
  {
    legalName: "Renee Baptiste",
    dob: "05/09/1996",
    email: "r.baptiste@example.com",
    provider: "Dr. Hannah Feldman, MD",
    reason: "Contraception consult",
    appointment: "Today, 12:00 PM",
  },
  {
    legalName: "Joy Nakamura",
    dob: "01/30/1984",
    email: "j.nakamura@example.com",
    provider: "Dr. Priya Raghunathan, DO",
    reason: "Annual well-woman exam",
    appointment: "Today, 12:15 PM",
  },
  {
    legalName: "Camille Duarte",
    dob: "09/17/1993",
    email: "c.duarte@example.com",
    provider: "Dr. Hannah Feldman, MD",
    reason: "Postpartum check",
    appointment: "Today, 12:30 PM",
  },
];

export function personaFor(index: number): Persona {
  return PERSONAS[index % PERSONAS.length];
}

/** The fixed eligibility response. Same every time: it is a demo, not a check. */
export const VERIFY_RESULT = {
  payer: "Aetna",
  plan: "Aetna Choice POS II PPO",
  memberId: "W2740119863",
  group: "0847221",
  status: "Active",
  effective: "01/01/2026",
  copay: "$25 office visit",
  deductible: "$1,500 · $410 remaining",
  coinsurance: "20% after deductible",
  network: "In network",
} as const;

/**
 * The copay in cents, kept beside the eligibility result so the payment screen
 * cannot charge a different number from the one the payer just returned. It
 * lives outside VERIFY_RESULT because that object is a bag of display strings.
 */
export const COPAY_CENTS = 2500;

export const ROLES = [
  {
    id: "billing",
    label: "Billing and denials",
    hint: "RCM, claims, AR",
  },
  {
    id: "frontdesk",
    label: "Front desk operations",
    hint: "Check-in, scheduling, staff",
  },
  {
    id: "owner",
    label: "Running the practice",
    hint: "Owner, administrator, MSO",
  },
] as const;

export type RoleId = (typeof ROLES)[number]["id"];

export function roleLabel(id: string | null | undefined): string {
  return ROLES.find((r) => r.id === id)?.label ?? EMPTY;
}
