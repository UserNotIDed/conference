/**
 * Every word in the attendee flow, in the order they see it.
 *
 * One file so copy can be rewritten without opening a component. The product
 * callouts (`alert`) are the marketing job of each screen: the prospect is
 * doing a patient's intake, and the alert says what the patient's version does
 * that this one cannot show. No invented statistics — benefit statements only.
 */

export const FLOW = {
  // -------------------------------------------------------------------------
  // Gate. No name yet, so nothing here is personalised.
  // -------------------------------------------------------------------------
  pin: {
    kicker: "Yosi",
    codeTitle: "Confirming it's you",
    codeSubtitle: "We texted a code to {masked} and filled it in for you.",
    codeCta: "Continue",
    codeVerifying: "Checking…",
    codeFootnote: "Your patients don't type this either.",
    matched: "Verified",
    alert:
      "Every Yosi link opens this way. Nothing on the record loads until the phone it belongs to answers.",
  },

  // -------------------------------------------------------------------------
  // The hub. Readiness score, four sections, one CTA.
  // -------------------------------------------------------------------------
  landing: {
    kicker: "Your demo",
    title: "Intake, end to end",
    badge: "5 sections",
    metaWho: "Run as yourself",
    metaTime: "About a minute",
    scoreLabel: "Readiness score",
    startCta: "Start intake",
    resumeCta: "Resume intake",
    footnote: "Finish it and we'll send you a charger.",
    sectionsLabel: "What to do",
    alert:
      "Your patients see a screen like this before a visit: what's outstanding, what's due, and how ready they are. Nobody has to phone them about it.",
  },

  // -------------------------------------------------------------------------
  // 1 — Demographics.
  // -------------------------------------------------------------------------
  demographics: {
    kicker: "1 · Demographics",
    title: "About you",
    subtitle: "The same details a patient confirms before a visit.",
    cta: "Continue",
    fixIt: "Fill in the highlighted fields to continue.",
    footnote: "You'll only be asked for this once.",
    alert:
      "Returning patients don't type this again. Yosi fills it from their last visit and asks them to confirm, so the form gets shorter every time.",
    addressAlert:
      "This is where we'll post your charger, so use an address you're happy to receive post at.",
    roleLabel: "What brings you by",
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
  // 2 — Card scan and the eligibility check. The RCM moment.
  // -------------------------------------------------------------------------
  card: {
    kicker: "2 · Insurance",
    title: "Insurance",
    subtitle:
      "Photograph the card and we read it, then check the coverage with the payer while the rest of the form is still being filled in.",
    scanTitle: "Tap to scan a card",
    scanSubtitle: "Insurance card, business card — anything",
    readingTitle: "Reading card…",
    capturedLabel: "Card read",
    cta: "Continue",
    footnote: "Nothing is photographed and nothing leaves your phone.",
    sampleNote: "Simulated — those are the details you gave us a moment ago.",
    alert:
      "Your front desk makes this check by phone or portal, one patient at a time. Yosi runs it the moment the card is captured and writes the answer to the chart.",
    eligibilityPending: "Checking eligibility",
    eligibilityAlert:
      "Coverage is confirmed before the visit, so there's no surprise self-pay at the desk and no claim denied for an inactive plan.",
  },

  // -------------------------------------------------------------------------
  // 3 — Copay collection.
  // -------------------------------------------------------------------------
  payment: {
    kicker: "3 · Payment",
    title: "Copay",
    subtitle:
      "Eligibility came back with an amount due. Yosi asks for it while the phone is still in their hand.",
    dueLabel: "Copay due",
    cardLabel: "Card number",
    cardPlaceholder: "Card on file · •••• 4242",
    cta: "Pay {amount}",
    paying: "Taking payment…",
    paidTitle: "Paid",
    paidNote: "Receipt texted. Nothing to collect at the desk.",
    continueCta: "Continue",
    skipCta: "Skip — I'll pay at the desk",
    alert:
      "Anything collected before the visit is something nobody has to invoice, chase or write off later. This is a demo — no card is charged.",
    multiLocation:
      "Each location processes separately. You'll confirm once and we'll handle the rest.",
  },

  // -------------------------------------------------------------------------
  // 4 — Tech stack. The patient's analogue is the medication list.
  // -------------------------------------------------------------------------
  stack: {
    alert:
      "For a patient, this screen is their medication list and health history. Filled in from their last visit, confirmed in two taps, never rewritten on a clipboard.",
  },

  // -------------------------------------------------------------------------
  // 5 — Leak diagnosis. The patient's analogue is the screener.
  // -------------------------------------------------------------------------
  leak: {
    kicker: "5 · Leak diagnosis",
    title: "Your numbers",
    subtitle:
      "Three you'll know off the top of your head. We'll put a figure on the no-shows, the front desk hours and the reworked claims.",
    cta: "See my annual leak",
    alert:
      "For a patient, this is the screener: a few taps that route them, flag anything urgent and reach the provider before the visit starts.",
  },

  // -------------------------------------------------------------------------
  // Result.
  // -------------------------------------------------------------------------
  result: {
    kicker: "Estimated annual leak",
    elapsed:
      "You did all that in {seconds} seconds — that is exactly what your patients feel.",
    cta: "Text this to me",
    ctaSending: "Sending…",
    ctaSent: "Sent — check your messages",
    skip: "Skip the text, keep going",
    showWork: "What are we assuming?",
    hideWork: "Hide the assumptions",
    assumptionsIntro:
      "Two of these are ours, not yours. They are deliberately conservative and they are the right thing to argue with.",
    benchmarkTitle: "How does that compare?",
    benchmarkBody:
      "We're asking every practice at this show the same three questions. We'll send you where you land against them.",
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
      "What you just did takes a front desk about five minutes a patient. Give us thirty and we'll show you it running on your forms, in your EHR.",
    cta: "Book a demo",
    opened: "Opened in a new tab. Pick any time that works.",
    footnote: "Your breakdown is in your messages and the charger is on its way.",
    alert:
      "We'll bring the figure you just worked out, so there's no discovery call to sit through twice.",
  },
} as const;
