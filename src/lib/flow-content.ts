/**
 * Every word in the flow, in the order they read it.
 *
 * One file so copy can be rewritten without opening a component.
 *
 * The frame: the person holding the phone is the prospect, not a patient.
 * They are running a check on their own practice and the payoff is a score and
 * a number. There is no patient roleplay and nothing here is simulated, so the
 * product callouts (`alert`) have one job — say what Yosi does about the thing
 * they just told us, in one sentence, with no invented statistics.
 */

export const FLOW = {
  // -------------------------------------------------------------------------
  // The hub. What this is, what it takes, what they get.
  // -------------------------------------------------------------------------
  landing: {
    kicker: "Yosi",
    title: "Check the health of your practice",
    badge: "3 sections",
    metaWho: "About your practice, not your patients",
    metaTime: "Around 90 seconds",
    scoreLabel: "Sections done",
    startCta: "Start the check",
    resumeCta: "Pick up where you left off",
    footnote: "Finish it and we'll send you a charger.",
    sectionsLabel: "What we'll ask",
    alert:
      "Nothing clinical and nothing about your patients — this is about how the front of the visit runs. You'll get a score, the arithmetic behind it, and what fixing it is worth.",
  },

  // -------------------------------------------------------------------------
  // 1 — Who they are. Every field is a lead field.
  // -------------------------------------------------------------------------
  contact: {
    kicker: "1 · About you",
    title: "Who are we scoring?",
    subtitle: "So we can send you the result and put your name on it.",
    cta: "Continue",
    fixIt: "Fill in the highlighted fields to continue.",
    footnote: "One follow-up email. Unsubscribe any time.",
    alert:
      "We'll email you the full breakdown — the score, every assumption behind it, and what each one is worth in your numbers.",
    addressAlert:
      "This is where we'll post your charger, so use an address you're happy to receive post at.",
    roleLabel: "What's your seat at the practice",
    roleOther: "Something else",
    roleOtherPlaceholder: "Tell us in a few words",
    labels: {
      name: "Your name",
      email: "Work email",
      practice: "Practice name",
      street: "Street address",
      unit: "Apt, suite, floor",
      city: "City",
      state: "State",
      zip: "ZIP",
    },
    placeholders: {
      name: "First and last",
      email: "name@practice.com",
      practice: "Lakeview Women's Health",
      street: "88 Congress Ave",
      unit: "Suite 400 — optional",
      city: "Austin",
      state: "TX",
      zip: "78701",
    },
  },

  // -------------------------------------------------------------------------
  // 2 — The stack. Who else is already in the workflow.
  // -------------------------------------------------------------------------
  stack: {
    alert:
      "This sets a quarter of your score. Anything a patient can finish on their own phone before they arrive counts for it; a clipboard counts against it.",
  },

  // -------------------------------------------------------------------------
  // 3 — The numbers. Five sliders, no keyboard.
  // -------------------------------------------------------------------------
  numbers: {
    kicker: "3 · Your numbers",
    title: "Five you'll know off the top of your head",
    subtitle:
      "Nothing here needs looking up. If you're not sure, your best guess is close enough to put a figure on.",
    cta: "Score my practice",
    alert:
      "Rough is fine. Everything here is yours, and every figure we add to it is printed next to the answer.",
    labels: {
      patientsPerDay: "Patients per day",
      noShowRate: "No-show rate",
      frontDeskStaff: "Front desk headcount",
      minutesPerIntake: "Minutes per patient on registration",
      collectedRate: "Patient balance collected up front",
    },
    hints: {
      minutesPerIntake:
        "Checking them in, keying the form, chasing the coverage.",
      collectedRate: "Copay and balance taken before they leave.",
    },
  },

  // -------------------------------------------------------------------------
  // The diagnosis.
  // -------------------------------------------------------------------------
  score: {
    kicker: "Practice health score",
    // {practice} is theirs when we have it.
    titleNamed: "{practice} scores {score}",
    title: "Your practice scores {score}",
    weightsLabel: "What it's made of",
    weightNote: "Each scored 0–100, then weighted. The weights are on screen.",
    cta: "What's it costing?",
    disclosure: "How is this scored?",
    hideDisclosure: "Hide the scoring",
    weakestLabel: "Most to gain: {label}.",
    disclosureBody:
      "Four measures, weighted into one number. Two come straight from what you just told us, two are worked out from your volumes. No industry data is mixed in — this is your answers, arranged.",
  },

  // -------------------------------------------------------------------------
  // The money. Leak first, then what fixing it returns.
  // -------------------------------------------------------------------------
  money: {
    kicker: "Estimated annual leak",
    roiKicker: "What fixing it returns",
    // {multiple} is like "5.9x"
    roiHeadline: "{net} a year back, net of what we cost",
    roiSub: "Every dollar you spend with us returns {multiple}. Payback in {months}.",
    roiCostLabel: "What Yosi costs at your volume",
    roiRecoveredLabel: "What we recover",
    cta: "Book a demo",
    skip: "Email it to me instead",
    showWork: "What are we assuming?",
    hideWork: "Hide the assumptions",
    assumptionsIntro:
      "Some of these are yours and some are ours. Ours are marked, and they are the right thing to argue with — tell us what your number is and we'll rerun it.",
    placeholderTag: "Ours",
    sourcedTag: "Sourced",
    benchmarkTitle: "How does that compare?",
    benchmarkBody:
      "We're asking every practice at this show the same questions. We'll send you where you land against them.",
    benchmarkOptIn: "Send me the front desk benchmark",
  },

  // -------------------------------------------------------------------------
  // The close.
  // -------------------------------------------------------------------------
  booking: {
    kicker: "Last thing",
    // {leak} is their own figure.
    title: "That's {leak} a year",
    titleNoLeak: "Worth half an hour of your time",
    subtitle:
      "Give us thirty minutes and we'll show you the same arithmetic running on your forms, in your EHR, with your own volumes in it.",
    cta: "Book a demo",
    opened: "Opened in a new tab. Pick any time that works.",
    footnote: "Your breakdown is on its way by email, and so is the charger.",
    alert:
      "We'll bring the score and the figure you just worked out, so there's no discovery call to sit through twice.",
  },
} as const;

/** Fills {placeholders} in the copy above. */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (whole, key) =>
    key in values ? String(values[key]) : whole,
  );
}
