import type { Session } from "@prisma/client";
import { parseJson, verificationState } from "./session";
import { personaFor, roleLabel } from "./demo";
import type { EhrEntry } from "./session";

/** The flattened shape both /staff and /admin read. */
export function toRow(s: Session) {
  const persona = personaFor(s.personaIndex);
  const identity = parseJson<{ legalName?: string; dob?: string }>(s.identity, {});
  const consent = parseJson<{
    signedAt?: string;
    path?: string;
    strokeCount?: number;
    reviewed?: string[];
  }>(s.consent, {});
  const insurance = parseJson<{ captured?: boolean; provider?: string }>(
    s.insurance,
    {},
  );
  const identification = parseJson<{ captured?: boolean }>(s.identification, {});
  const health = parseJson<{
    medications?: string[];
    conditions?: string[];
    allergies?: string[];
  }>(s.health, {});
  const questionnaire = parseJson<Record<string, string | string[]>>(
    s.questionnaire,
    {},
  );
  const calcResult = parseJson<{ total?: number } | null>(s.calcResult, null);
  const calcInputs = parseJson<{
    patientsPerDay?: number;
    noShowRate?: number;
    frontDeskStaff?: number;
  } | null>(s.calcInputs, null);
  const v = verificationState(s);

  return {
    token: s.token,
    phone: s.phone,
    source: s.source,
    keyword: s.keyword,
    role: s.role,
    roleLabel: s.role === "other" ? (s.roleOther || "Other") : roleLabel(s.role),
    roleOther: s.roleOther,
    paidAt: s.paidAt?.toISOString() ?? null,
    copayCents: s.copayCents,
    patientName: identity.legalName || persona.legalName,
    dob: identity.dob || persona.dob,
    provider: persona.provider,
    reason: persona.reason,
    appointment: persona.appointment,
    cardCaptured: Boolean(insurance.captured),
    cardProvider: insurance.provider ?? "",
    idCaptured: Boolean(identification.captured),
    otpAt: s.otpAt?.toISOString() ?? null,
    medications: health.medications ?? [],
    conditions: health.conditions ?? [],
    allergies: health.allergies ?? [],
    questionnaire,
    questionnaireCount: Object.keys(questionnaire).length,
    signature: consent.path ?? "",
    signedAt: consent.signedAt ?? null,
    consentsReviewed: consent.reviewed ?? [],
    verifyStatus: v.status,
    verifiedAt: s.verifiedAt?.toISOString() ?? null,
    verifySeconds:
      s.verifiedAt && s.verifyStartedAt
        ? (s.verifiedAt.getTime() - s.verifyStartedAt.getTime()) / 1000
        : null,
    ehrLog: parseJson<EhrEntry[]>(s.ehrLog, []),
    ehrWrittenAt: s.ehrWrittenAt?.toISOString() ?? null,
    openedAt: s.openedAt?.toISOString() ?? null,
    startedAt: s.startedAt?.toISOString() ?? null,
    finishedAt: s.finishedAt?.toISOString() ?? null,
    elapsedMs: s.elapsedMs,
    calcInputs,
    calcTotal: calcResult?.total ?? null,
    calcSmsAt: s.calcSmsAt?.toISOString() ?? null,
    techStack: parseJson<string[]>(s.techStack, []),
    ehrSystem: s.ehrSystem,
    competitorTool: s.competitorTool,
    competitorSatisfaction: s.competitorSatisfaction,
    captureName: s.captureName,
    captureTitle: s.captureTitle,
    captureEmail: s.captureEmail,
    capturePractice: s.capturePractice ?? s.practiceName,
    captureStreet: s.captureStreet,
    captureUnit: s.captureUnit,
    captureCity: s.captureCity,
    captureState: s.captureState,
    captureZip: s.captureZip,
    captureAddress: s.captureAddress,
    bookedAt: s.bookingClickedAt?.toISOString() ?? null,
    bookedSlot: s.bookedSlot,
    captureOptIn: s.captureOptIn ?? false,
    capturedAt: s.capturedAt?.toISOString() ?? null,
    practiceName: s.practiceName,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export type Row = ReturnType<typeof toRow>;
