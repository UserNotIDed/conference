/**
 * What we sell, as a prospect would recognise it.
 *
 * Taken from the plan sheet and grouped the way it is grouped there, so a rep
 * ticking boxes on a call is ticking the same things the quote will list. The
 * tier is here because what somebody is interested in is also what decides
 * which plan they end up on, and that is worth seeing on the readout rather
 * than working out afterwards.
 */
export type Tier = "Foundation" | "Performance" | "Complete";

export type Service = { id: string; label: string; tier: Tier };

export const SERVICES: Service[] = [
  { id: "intake", label: "Mobile and in-office intake", tier: "Foundation" },
  { id: "forms", label: "On-demand forms and data capture", tier: "Foundation" },
  { id: "screeners", label: "Clinical screeners and assessments", tier: "Foundation" },
  { id: "messaging", label: "Two-way patient messaging", tier: "Foundation" },
  { id: "reminders", label: "Automated appointment reminders", tier: "Foundation" },
  { id: "campaigns", label: "Practice campaigns and broadcast", tier: "Foundation" },
  { id: "payments", label: "Patient payments and card on file", tier: "Foundation" },
  { id: "analytics", label: "Operational analytics", tier: "Foundation" },
  { id: "selfsched", label: "Appointment self-scheduling", tier: "Performance" },
  { id: "confirmations", label: "Automated confirmations", tier: "Performance" },
  { id: "eligibility", label: "Insurance eligibility verification", tier: "Performance" },
  { id: "payerid", label: "Payer ID matching and benefits", tier: "Performance" },
  { id: "reputation", label: "Reputation management and surveys", tier: "Performance" },
  { id: "telehealth", label: "Telehealth and virtual visits", tier: "Complete" },
  { id: "virtualintake", label: "Virtual intake workflows", tier: "Complete" },
];

export const TIERS: Tier[] = ["Foundation", "Performance", "Complete"];

/**
 * The lowest plan that covers everything they asked about.
 *
 * Shown on the readout because the alternative is a rep doing this in their
 * head on a call. No price attached: the plan names are ours to say out loud,
 * the rates are negotiated per group and are not in this repository.
 */
export function tierFor(selected: string[]): Tier | null {
  if (selected.length === 0) return null;
  const picked = SERVICES.filter((s) => selected.includes(s.id));
  if (picked.some((s) => s.tier === "Complete")) return "Complete";
  if (picked.some((s) => s.tier === "Performance")) return "Performance";
  return "Foundation";
}
