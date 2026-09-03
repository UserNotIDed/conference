/**
 * Every word the prospect reads, in one place.
 *
 * These are the screens they answer as themselves rather than as the patient:
 * the role question, the timer payoff, the leak calculator, the qualifying
 * taps, the shipping ask, and the close. This is marketing copy on a
 * marketing surface — it will change more often than anything else in the
 * app, and it should be changeable without going near a component.
 *
 * Superseded in most places by flow-content.ts, which holds the screens in the
 * order the attendee meets them. The calculator's assumptions and formulas live
 * in calc.ts — those are numbers to defend, not copy to tune.
 */

export const PROSPECT_COPY = {
  role: {
    kicker: "Yosi · Booth demo",
    title: "What brings you by?",
    subtitle:
      "One tap, then you’ll go through our intake yourself — the same way your patients would.",
    footnote: "About 60 seconds. You’ll get your own numbers at the end.",
  },

  done: {
    // {seconds} is replaced with the measured number.
    title: "Done in {seconds} seconds.",
    subtitle:
      "That's the whole thing. Your patient just did it from a parking lot, before they walked in.",
    // Used instead when a session ran long enough that the count would undersell it.
    titleSlow: "Done — and that’s the whole thing.",
    subtitleSlow:
      "Your patient does this from a parking lot before they walk in — without a booth conversation in the middle of it.",
    cta: "See what that’s worth to you",
    footnote: "Three questions. You’re a practice manager again.",
    rows: {
      intake: "Intake complete",
      eligibilityPending: "Checking eligibility with Aetna",
      eligibilityPendingDetail:
        "Runs in the background — the front desk sees it land.",
      writeback: "Written back to the chart",
      writebackDetail: "Demographics, coverage and consent, no re-keying.",
    },
  },

  calc: {
    kicker: "4 · Leak diagnosis",
    title: "Let’s price your annual leak.",
    subtitle:
      "Three numbers you know off the top of your head. We’ll put a figure on the no-shows, the front desk hours and the reworked claims, and show the arithmetic — your leak, not a brochure’s.",
    cta: "See what it’s worth",
    labels: {
      patientsPerDay: "Patients per day",
      noShowRate: "No-show rate",
      frontDeskStaff: "Front desk headcount",
    },
  },

  calcResult: {
    kicker: "Estimated annual leak",
    // The elapsed time lands here rather than on a screen of its own.
    // {seconds} is replaced with the measured number.
    elapsed:
      "You did all that in {seconds} seconds — that is exactly what your patients feel.",
    cta: "Text this to me",
    ctaSending: "Sending…",
    ctaSent: "Sent — check your messages",
    skip: "Skip the text, keep going",
    benchmarkTitle: "How does that compare?",
    benchmarkBody:
      "We’re asking every practice at this show the same three questions. We’ll send you where you land against them.",
    benchmarkOptIn: "Send me the front desk benchmark",
    showWork: "What are we assuming?",
    hideWork: "Hide the assumptions",
    assumptionsIntro:
      "Two of these are ours, not yours. They are deliberately conservative and they are the right thing to argue with.",
  },

  qualify: {
    kicker: "Your practice",
    ehrTitle: "What are you running today?",
    ehrSubtitle:
      "So we know what we’d be plugging into. Two taps and we’re done asking.",
    todayTitle: "And how do patients fill this in now?",
    todaySubtitle: "Last one.",
  },

  capture: {
    // Up front, before the demo. Two jobs: it gets the lead before anyone can
    // drift off, and it gives us their real name so the rest of the flow can
    // be filled in with their details rather than a stranger's.
    kicker: "1 · Demographics",
    title: "Tell us who you are.",
    subtitle:
      "The same details your patients give, and where to post your charger. You’ll see them come straight back on the next screen.",
    cta: "Send me the charger",
    footnote: "One follow-up email. Unsubscribe any time.",
    labels: {
      role: "What brings you by",
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
    fixIt: "Just the highlighted fields and it’s yours.",
  },

  thanks: {
    // Deliberately does not restate the screen before it. The number, the
    // assumptions and the breakdown link were all on the result screen; this
    // one has a single job: get a time in the diary.
    kicker: "Last thing",
    title: "Pick a time.",
    subtitle:
      "We’ll come with your numbers already on the screen. No deck, and no discovery call you have to sit through twice.",
    cta: "Confirm {slot}",
    ctaEmpty: "Pick a time above",
    otherTimes: "None of these work — show me more",
    confirmedTitle: "You’re booked.",
    // {slot} and {email} are filled in.
    confirmedBody: "{slot}. The invite is on its way to {email}.",
    confirmedFootnote:
      "Charger’s on its way too — we’ll email you when it ships.",
    poweredBy: "Booked with Yosi scheduling — the same module your patients use.",
  },
} as const;

/**
 * Where "Book a demo" goes. Point BOOKING_URL at the real scheduling link when
 * you have it — it is an env var so swapping it is a redeploy, not a rebuild.
 */
export const BOOKING_URL =
  process.env.NEXT_PUBLIC_BOOKING_URL ?? "https://yosi.health";

/** Fills {placeholders} in the copy above. */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (whole, key) =>
    key in values ? String(values[key]) : whole,
  );
}
