import type { ClientSession } from "./session";
import { PRACTICE, VERIFY_RESULT, personaFor } from "./demo";

/**
 * A fully-populated session for the preview surface.
 *
 * Every screen in the flow reads from a ClientSession, so previewing one in
 * isolation means handing it a plausible session rather than making the viewer
 * walk the flow to build one up. Nothing here touches the database.
 */
export function mockSession(over: Partial<ClientSession> = {}): ClientSession {
  return {
    token: "d3k9",
    phone: "+12145550148",
    role: null,
    practiceName: null,
    practice: PRACTICE,
    persona: personaFor(0),
    otpAt: new Date().toISOString(),
    cardAt: new Date().toISOString(),
    paidAt: null,
    copayCents: 4500,
    roleOther: null,
    identity: { legalName: "Maria Alvarez", dob: "03/14/1988" },
    identification: { captured: true },
    insurance: { captured: true },
    health: {
      medications: [
        "Levothyroxine · 75 mcg · Daily",
        "Prenatal vitamin · Daily",
        "Iron (ferrous sulfate) · 325 mg · Daily",
      ],
      conditions: ["Hypothyroidism", "Iron-deficiency anemia"],
      allergies: ["Penicillin — rash"],
    },
    questionnaire: {},
    consent: {},
    startedAt: new Date().toISOString(),
    startedAtMs: Date.now(),
    finishedAt: null,
    elapsedMs: 51000,
    verify: {
      status: "complete",
      remainingMs: 0,
      durationMs: 7200,
      verifiedAt: new Date().toISOString(),
      result: { ...VERIFY_RESULT },
    },
    techStack: [],
    ehrSystem: null,
    competitorTool: null,
    competitorSatisfaction: null,
    calcInputs: null,
    calcResult: null,
    capture: {
      name: null,
      title: null,
      email: null,
      practice: null,
      street: null,
      unit: null,
      city: null,
      state: null,
      zip: null,
      address: null,
      optIn: null,
      capturedAt: null,
      bookedAt: null,
      bookedSlot: null,
    },
    ...over,
  };
}

/**
 * A session that has already answered everything.
 *
 * The diagnosis screens read prior answers — the stack sets a quarter of the
 * score, the volumes set all of the money — so previewing them against a blank
 * session shows an unscored practice, which is not a screen that exists. The
 * landing page has the opposite problem: handed a filled session it opens
 * reading "2 of 3 done", which is not the screen an attendee meets either. So
 * the picker uses whichever of the two the screen actually needs.
 */
export function answeredSession(over: Partial<ClientSession> = {}): ClientSession {
  return mockSession({
    role: "frontdesk",
    // athena plus an incumbent they are unhappy with — the segment worth
    // showing, and the only one that exercises the 2b screen.
    techStack: ["athenahealth", "Phreesia"],
    ehrSystem: "athenahealth",
    competitorTool: "Phreesia",
    competitorSatisfaction: "It frustrates us",
    calcInputs: {
      patientsPerDay: 45,
      noShowRate: 0.14,
      frontDeskStaff: 3,
      collectedRate: 0.5,
    },
    capture: {
      ...mockSession().capture,
      name: "Dana Whitfield",
      email: "dana@lakeviewwh.com",
      practice: "Lakeview Women's Health",
      capturedAt: new Date().toISOString(),
    },
    ...over,
  });
}
