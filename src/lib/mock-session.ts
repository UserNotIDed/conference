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
    role: "frontdesk",
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
    calcInputs: { patientsPerDay: 42, noShowRate: 0.12, frontDeskStaff: 3 },
    calcResult: null,
    capture: {
      name: null,
      title: null,
      email: null,
      practice: "Cedar Park OB-GYN",
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
