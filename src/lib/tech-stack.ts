/**
 * What's in their stack.
 *
 * Replaces the old two-tap "what EHR / how do patients fill this in" pair. At
 * this show almost everyone is on athenahealth, so asking for the EHR alone
 * buys one answer everybody gives. The stack is where the useful signal is:
 * who else is already in the workflow, and specifically whether an intake
 * vendor is — because that turns the conversation from "do you need this" into
 * "what is wrong with the one you have".
 *
 * Grid of common choices first, more behind a disclosure, and a search for
 * anything not listed.
 */

export type Tool = { name: string; kind: ToolKind };
export type ToolKind =
  | "ehr"
  | "intake"
  | "engagement"
  | "scribe"
  | "payments"
  | "rcm"
  | "manual";

/** Shown up front. athenahealth first — it is the house answer at this show. */
export const COMMON_TOOLS: Tool[] = [
  { name: "athenahealth", kind: "ehr" },
  { name: "eClinicalWorks", kind: "ehr" },
  { name: "Epic", kind: "ehr" },
  { name: "Phreesia", kind: "intake" },
  { name: "Luma Health", kind: "engagement" },
  { name: "Weave", kind: "engagement" },
  { name: "Paper on a clipboard", kind: "manual" },
  { name: "Our patient portal", kind: "manual" },
  { name: "Front desk keys it in", kind: "manual" },
];

/** Behind "show more". Long tail, still one tap. */
export const MORE_TOOLS: Tool[] = [
  { name: "NextGen", kind: "ehr" },
  { name: "Greenway", kind: "ehr" },
  { name: "Modernizing Medicine", kind: "ehr" },
  { name: "Tebra / Kareo", kind: "ehr" },
  { name: "Oracle Health (Cerner)", kind: "ehr" },
  { name: "AdvancedMD", kind: "ehr" },
  { name: "Clearwave", kind: "intake" },
  { name: "IntakeQ", kind: "intake" },
  { name: "Klara", kind: "engagement" },
  { name: "Artera", kind: "engagement" },
  { name: "Solutionreach", kind: "engagement" },
  { name: "Relatient", kind: "engagement" },
  { name: "Abridge", kind: "scribe" },
  { name: "Nuance DAX", kind: "scribe" },
  { name: "Freed", kind: "scribe" },
  { name: "Suki", kind: "scribe" },
  { name: "InstaMed", kind: "payments" },
  { name: "Rectangle Health", kind: "payments" },
  { name: "Waystar", kind: "rcm" },
  { name: "Availity", kind: "rcm" },
  { name: "Office Ally", kind: "rcm" },
];

export const ALL_TOOLS: Tool[] = [...COMMON_TOOLS, ...MORE_TOOLS];

export const NONE_OPTION = "None of these — we do it all by hand";

/**
 * Anyone already running one of these is on a competitor, and the next
 * question is worth asking. Kept as a list rather than a `kind` check because
 * "intake" is the only category that makes someone a displacement target.
 */
export const COMPETITOR_TOOLS = new Set(
  ALL_TOOLS.filter((t) => t.kind === "intake").map((t) => t.name),
);

export function competitorIn(selected: string[]): string | null {
  return selected.find((s) => COMPETITOR_TOOLS.has(s)) ?? null;
}

/**
 * Satisfaction, asked only of people already paying someone else. The wording
 * is deliberately blunt — "it's fine" is the answer that actually predicts a
 * switch, and a five-point scale would bury it.
 */
export const SATISFACTION = [
  "Love it — not going anywhere",
  "It's fine",
  "It frustrates us",
  "We're actively looking to replace it",
] as const;

export const TECH_STACK_COPY = {
  kicker: "4 · Tech stack",
  title: "What are you already running?",
  subtitle:
    "Pick anything you use today. We'll tell you what plugs in and what doesn't.",
  showMore: (n: number) => `Show ${n} more`,
  showLess: "Show fewer",
  addLabel: "Add anything else",
  addPlaceholder: "Type a system, like Dragon",
  addCta: "Add",
  noneLabel: NONE_OPTION,
  emptyFooter: "Nothing selected yet",
  countFooter: (n: number) => `${n} selected`,
  cta: "Continue",
  competitor: {
    kicker: "4 · Tech stack",
    title: "How's {tool} working out?",
    subtitle: "Straight answer is more useful to you than a polite one.",
  },
} as const;
