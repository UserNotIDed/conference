/**
 * What's in their stack.
 *
 * Replaces the old two-tap "what EHR / how do patients fill this in" pair. At
 * this show almost everyone is on athenahealth, so asking for the EHR alone
 * buys one answer everybody gives. The stack is where the useful signal is:
 * who else is already in the workflow, and specifically whether an intake
 * vendor is, because that turns the conversation from "do you need this" into
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

/** Shown up front. athenahealth first, because it is the house answer at this show. */
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

export const NONE_OPTION = "None of these, we do it all by hand";

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

/** Everything that means "a person is doing this by hand". */
export const MANUAL_TOOLS = new Set([
  "Paper on a clipboard",
  "Front desk keys it in",
  NONE_OPTION,
]);

export type IntakeMode = "vendor" | "portal" | "paper" | "unknown";

/**
 * How intake actually gets done today, from what they selected.
 *
 * One classifier, used by the follow-up question and by the score. It used to
 * be written twice, once here as "is there a competitor" and once in score.ts
 * as a posture, and the two could disagree about a practice running both a
 * vendor and a clipboard.
 */
export function intakeMode(selected: string[]): IntakeMode {
  if (selected.some((t) => COMPETITOR_TOOLS.has(t))) return "vendor";
  if (selected.some((t) => MANUAL_TOOLS.has(t))) return "paper";
  if (selected.some((t) => /portal/i.test(t))) return "portal";
  return "unknown";
}

/**
 * What the follow-up question is about.
 *
 * The old version only fired for people already paying an intake vendor, which
 * at this show is a small minority, so the most useful screen in the flow was
 * the one almost nobody saw. Everyone has a way of doing intake and everyone
 * has an opinion about it; the subject just changes.
 */
export function intakeSubject(selected: string[]): string {
  const rival = competitorIn(selected);
  if (rival) return rival;
  switch (intakeMode(selected)) {
    case "portal":
      return "your patient portal";
    case "paper":
      return "paper intake";
    default:
      return "your current setup";
  }
}

/**
 * Satisfaction with whatever they run today.
 *
 * Four options, deliberately blunt. "It's fine" is the answer that actually
 * predicts a switch and a five-point scale would bury it under a neutral
 * midpoint nobody means anything by.
 */
export const SATISFACTION = [
  "Works well, we would keep it",
  "It's fine",
  "It frustrates us",
  "We're actively looking to change it",
] as const;

/**
 * What actually breaks. Lead intel, not score input.
 *
 * Deliberately kept out of the arithmetic: no-shows and collections are
 * already dimensions, so counting a complaint about them again would score the
 * same problem twice. What this buys is an opening line for the follow-up call
 * that is in their words rather than ours.
 */
export const PAIN_POINTS = [
  "Patients not turning up",
  "Forms come back half-finished",
  "Re-keying it into the chart",
  "Chasing insurance before the visit",
  "Collecting what patients owe",
  "The queue at the front desk",
  "Reaching patients at all",
] as const;

export const NO_PAIN = "Honestly, it works";

export const TECH_STACK_COPY = {
  kicker: "2 · Your setup",
  title: "What are you already running?",
  subtitle:
    "Pick anything you use today, including the things that aren't software.",
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
    kicker: "2 · Your setup",
    title: "How's {tool} working out?",
    subtitle: "A straight answer is more use to you than a polite one.",
    satisfactionLabel: "Overall",
    painLabel: "What actually costs you time",
    painHint: "Pick as many as apply, or none.",
    noPainLabel: NO_PAIN,
    cta: "Continue",
    skip: "Skip this",
  },
} as const;
