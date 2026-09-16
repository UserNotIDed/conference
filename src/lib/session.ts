import type { Session } from "@prisma/client";
import { prisma } from "./db";
import { PRACTICE, VERIFY_RESULT, personaFor } from "./demo";

export function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export type EhrEntry = { at: string; line: string };

/**
 * Faked EHR writeback. It logs a line and stamps a time. That is the entire
 * integration, and the point is that it looks like work is happening on the
 * staff screen rather than that anything is written anywhere.
 */
export async function ehrAppend(
  session: Session,
  lines: string[],
): Promise<EhrEntry[]> {
  const existing = parseJson<EhrEntry[]>(session.ehrLog, []);
  const now = new Date().toISOString();
  const next = [...existing, ...lines.map((line) => ({ at: now, line }))];
  await prisma.session.update({
    where: { id: session.id },
    data: { ehrLog: JSON.stringify(next), ehrWrittenAt: new Date() },
  });
  return next;
}

/**
 * Eligibility resolves by wall clock rather than by a timer held in memory.
 *
 * A serverless function cannot keep a 6-second setTimeout alive between the
 * request that starts the check and the request that reads it, and a poll can
 * be dropped by conference wifi and retried a minute later. Storing the start
 * time and a duration means any later read computes the same answer, and a
 * reload mid-check picks up exactly where it left off.
 */
export function verificationState(s: Session): {
  status: "idle" | "pending" | "complete";
  elapsedMs: number;
  remainingMs: number;
  durationMs: number;
} {
  if (!s.verifyStartedAt || !s.verifyDurationMs) {
    return { status: "idle", elapsedMs: 0, remainingMs: 0, durationMs: 0 };
  }
  const elapsedMs = Date.now() - s.verifyStartedAt.getTime();
  const durationMs = s.verifyDurationMs;
  const done = s.verifiedAt !== null || elapsedMs >= durationMs;
  return {
    status: done ? "complete" : "pending",
    elapsedMs,
    remainingMs: Math.max(0, durationMs - elapsedMs),
    durationMs,
  };
}

/** Stamps the completion the first time anyone observes the clock running out. */
export async function settleVerification(s: Session): Promise<Session> {
  const state = verificationState(s);
  if (state.status !== "complete" || s.verifiedAt) return s;
  const verifiedAt = new Date(s.verifyStartedAt!.getTime() + s.verifyDurationMs!);
  const updated = await prisma.session.update({
    where: { id: s.id },
    data: { verifiedAt, verifyResult: JSON.stringify(VERIFY_RESULT) },
  });
  await ehrAppend(updated, [
    `Eligibility 270/271 response received: ${VERIFY_RESULT.payer} ${VERIFY_RESULT.status}`,
    `Coverage written to chart · member ${VERIFY_RESULT.memberId} · ${VERIFY_RESULT.copay}`,
  ]);
  return prisma.session.findUniqueOrThrow({ where: { id: s.id } });
}

/** The shape the browser gets. Nothing in here is a secret, but keep it small. */
export function toClient(s: Session) {
  const persona = personaFor(s.personaIndex);
  const v = verificationState(s);
  return {
    token: s.token,
    phone: s.phone,
    role: s.role,
    practiceName: s.practiceName,
    practice: PRACTICE,
    persona,
    otpAt: s.otpAt?.toISOString() ?? null,
    cardAt: s.cardAt?.toISOString() ?? null,
    paidAt: s.paidAt?.toISOString() ?? null,
    copayCents: s.copayCents,
    roleOther: s.roleOther,
    identity: parseJson<Record<string, string>>(s.identity, {}),
    identification: parseJson<Record<string, unknown>>(s.identification, {}),
    insurance: parseJson<Record<string, unknown>>(s.insurance, {}),
    health: parseJson<{
      medications?: string[];
      conditions?: string[];
      allergies?: string[];
    }>(s.health, {}),
    questionnaire: parseJson<Record<string, string | string[]>>(s.questionnaire, {}),
    consent: parseJson<Record<string, unknown>>(s.consent, {}),
    startedAt: s.startedAt?.toISOString() ?? null,
    startedAtMs: s.startedAtMs ? Number(s.startedAtMs) : null,
    finishedAt: s.finishedAt?.toISOString() ?? null,
    elapsedMs: s.elapsedMs,
    verify: {
      status: v.status,
      remainingMs: v.remainingMs,
      durationMs: v.durationMs,
      verifiedAt: s.verifiedAt?.toISOString() ?? null,
      result: parseJson<Record<string, string> | null>(s.verifyResult, null),
    },
    calcInputs: parseJson<Record<string, number> | null>(s.calcInputs, null),
    calcResult: parseJson<Record<string, unknown> | null>(s.calcResult, null),
    techStack: parseJson<string[]>(s.techStack, []),
    ehrSystem: s.ehrSystem,
    competitorTool: s.competitorTool,
    intakeSatisfaction: s.intakeSatisfaction,
    painPoints: parseJson<string[]>(s.painPoints, []),
    capture: {
      name: s.captureName,
      title: s.captureTitle,
      email: s.captureEmail,
      practice: s.capturePractice ?? s.practiceName,
      street: s.captureStreet,
      unit: s.captureUnit,
      city: s.captureCity,
      state: s.captureState,
      zip: s.captureZip,
      address: s.captureAddress,
      optIn: s.captureOptIn,
      capturedAt: s.capturedAt?.toISOString() ?? null,
      bookedAt: s.bookingClickedAt?.toISOString() ?? null,
      bookedSlot: s.bookedSlot,
    },
  };
}

export type ClientSession = ReturnType<typeof toClient>;
