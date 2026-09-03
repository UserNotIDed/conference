/**
 * The prospect's own intake.
 *
 * The demo is not a patient roleplay. The prospect goes through intake as
 * themselves — same screens, same beats, same one-time code and card scan the
 * patient gets — and every answer they give is a lead field. They feel the
 * product by being on the receiving end of it, and we finish holding a
 * qualified record instead of a shipping label.
 *
 * The mapping is deliberate:
 *   patient's one-time code   → their one-time code
 *   patient's insurance card  → their business card
 *   patient's health history  → what they run today
 *   patient's questionnaire   → their volumes
 *   "done in 47 seconds"      → "that's what your patients feel"
 */

/** Canned read from the business card scan. Stands in for OCR. */
export type BusinessCard = {
  name: string;
  title: string;
  practice: string;
  email: string;
};

export const BUSINESS_CARD: BusinessCard = {
  name: "Jordan Ellery",
  title: "Practice Administrator",
  practice: "Cedar Park OB-GYN",
  email: "j.ellery@cedarparkobgyn.com",
};

export const PROSPECT_INTAKE_COPY = {
  verify: {
    kicker: "Yosi",
    // Stage one: the same "we'll text you a code" gate the patient sees.
    phoneTitle: "Let’s verify it’s you",
    phoneSubtitle:
      "This is where your patient starts. Nothing shows until the phone that owns the record is proved.",
    // Used once we know their name — the greeting replaces the title.
    greetedSubtitle:
      "Now the demo, exactly as your patient gets it. Nothing shows until the phone that owns the record is proved.",
    phoneLabel: "Phone on file",
    phoneCta: "Text me a code",
    // Stage two: the code, filled in for them.
    codeTitle: "Enter the code",
    codeSubtitle: "We sent a six-digit code to {masked}.",
    codeCta: "Verify",
    codeVerifying: "Verifying…",
    codeFootnote: "Autofilled from your messages — exactly as it is for a patient.",
    matched: "Code matched",
  },

  card: {
    kicker: "2 · Card scan",
    title: "This is the scan your patients do.",
    subtitle:
      "They photograph an insurance card and the form fills itself — no typing, nothing for your front desk to re-key. Tap it and watch it happen with your details.",
    scanTitle: "Tap to scan a card",
    scanSubtitle: "Same capture, insurance card or business card",
    readingTitle: "Reading card…",
    capturedLabel: "Card read",
    manualLabel: "Type it instead",
    cta: "Continue",
    footnote: "Nothing is photographed and nothing leaves your phone.",
    sampleNote:
      "Simulated for the demo — that is the data you gave us a moment ago, back out the other side.",
    labels: {
      name: "Name",
      title: "Title",
      practice: "Practice",
      email: "Work email",
    },
  },

  done: {
    // {seconds} is replaced with the measured number.
    title: "You did that in {seconds} seconds.",
    subtitle:
      "One code, one photo, a few taps. That is exactly what your patients feel — from a parking lot, before they walk in.",
    titleSlow: "That’s the whole thing.",
    subtitleSlow:
      "One code, one photo, a few taps — from a parking lot, before your patient walks in.",
    cta: "See what that’s worth to you",
    footnote: "Your numbers, your practice. One screen.",
    rows: {
      verified: "Identity verified",
      verifiedDetail: "One-time code to the phone on file.",
      card: "Details captured",
      cardDetail: "Read off your card, nothing re-keyed.",
      systems: "Systems on file",
      systemsDetail: "What you run, and how intake happens today.",
    },
  },
} as const;

// ---------------------------------------------------------------------------
// The landing page — first thing after the PIN.
//
// It exists so nobody starts a form without knowing how long it is. Four
// sections, named, plus the reason to finish. A booth demo that opens straight
// into a text field loses people who cannot see the end of it.
// ---------------------------------------------------------------------------

export const LANDING_COPY = {
  kicker: "Yosi",
  title: "See what intake is costing you.",
  subtitle:
    "Four short sections. You’ll leave with a dollar figure for your own practice — and we’ll send you a charger for your trouble.",
  sections: [
    {
      label: "Demographics",
      note: "Who you are, and where to post the charger.",
    },
    {
      label: "Card scan",
      note: "The capture your patients use. One tap.",
    },
    {
      label: "Tech stack",
      note: "What you’re already running.",
    },
    {
      label: "Leak diagnosis",
      note: "Three numbers in, your annual leak out.",
    },
  ],
  cta: "Start intake",
  footnote: "About a minute. Nothing here is a real medical record.",
} as const;

export const BOOKING_COPY = {
  kicker: "Last thing",
  title: "Want it on your own forms?",
  subtitle:
    "We’ll come with your numbers already on the screen. Pick a time that suits you.",
  cta: "Book a demo",
  opened: "Opened — grab any slot that works.",
  footnote: "Your breakdown is in your messages, and the charger is on its way.",
} as const;
