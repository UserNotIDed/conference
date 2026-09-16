import type { ClientSession } from "./session";
import { PRACTICE, VERIFY_RESULT, personaFor } from "./demo";

/**
 * An empty session: the shape every screen reads, with nothing answered.
 *
 * Used by the preview picker and by the standalone deployment, where there is
 * no database to read one from. Nothing here touches Prisma, which is what
 * lets the flow render on a host with no database at all.
 */
export function blankSession(over: Partial<ClientSession> = {}): ClientSession {
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
      allergies: ["Penicillin, rash"],
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
    intakeSatisfaction: null,
    painPoints: [],
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
 * The diagnosis screens read prior answers. The stack sets a quarter of the
 * score and the volumes set all of the money, so previewing them against a blank
 * session shows an unscored practice, which is not a screen that exists. The
 * landing page has the opposite problem: handed a filled session it opens
 * reading "2 of 3 done", which is not the screen an attendee meets either. So
 * the picker uses whichever of the two the screen actually needs.
 */
export function answeredSession(over: Partial<ClientSession> = {}): ClientSession {
  return blankSession({
    role: "frontdesk",
    // athena plus an incumbent they are unhappy with: the segment worth
    // showing, and the only one that exercises the 2b screen.
    techStack: ["athenahealth", "Phreesia"],
    ehrSystem: "athenahealth",
    competitorTool: "Phreesia",
    intakeSatisfaction: "It frustrates us",
    painPoints: ["Re-keying it into the chart", "Chasing insurance before the visit"],
    calcInputs: {
      patientsPerDay: 45,
      noShowRate: 0.14,
      frontDeskStaff: 3,
      collectedRate: 0.5,
    },
    capture: {
      ...blankSession().capture,
      name: "Dana Whitfield",
      email: "dana@lakeviewwh.com",
      practice: "Lakeview Women's Health",
      capturedAt: new Date().toISOString(),
    },
    ...over,
  });
}
