import type { Prisma, Session } from "@prisma/client";
import { prisma } from "./db";
import { calculate } from "./calc";
import { ehrAppend, parseJson } from "./session";
import { PRACTICE, VERIFY_RESULT, personaFor } from "./demo";
import { ALL_TOOLS, COMPETITOR_TOOLS } from "./tech-stack";

const EHR_NAMES = new Set(
  ALL_TOOLS.filter((t) => t.kind === "ehr").map((t) => t.name),
);

/**
 * Applies a batch of keyed patches to a session.
 *
 * Every branch is idempotent: timestamps are only stamped when still null, JSON
 * blobs are replaced wholesale rather than merged, and the EHR writeback runs
 * once. The sync queue is allowed to deliver the same patch any number of
 * times, which is what makes "advance the screen, sync later" safe.
 */

export type IncomingPatch = { key: string; body: Record<string, unknown> };

const str = (v: unknown): string | undefined =>
  typeof v === "string" ? v.slice(0, 400) : undefined;
const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;
/** Free-text lists from the client: bounded in both length and element size. */
const arr = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.slice(0, 40).map((x) => String(x).slice(0, 120))
    : [];

export async function applyPatches(
  session: Session,
  patches: IncomingPatch[],
): Promise<Session> {
  let s = session;
  const data: Prisma.SessionUpdateInput = {};
  let finishing = false;
  let startVerification = false;

  for (const { key, body = {} } of patches) {
    switch (key) {
      case "opened":
        if (!s.openedAt) data.openedAt = new Date();
        break;

      case "role": {
        const role = str(body.role);
        if (role && ["billing", "frontdesk", "owner"].includes(role)) {
          data.role = role;
          if (!s.roleAt) data.roleAt = new Date();
        }
        break;
      }

      case "started":
        // The clock starts on the first render of the first intake screen, and
        // never restarts, and a reload mid-flow keeps the original start.
        if (!s.startedAt) {
          data.startedAt = new Date();
          const clientMs = num(body.clientMs);
          if (clientMs) data.startedAtMs = String(Math.round(clientMs));
        }
        break;

      case "otp":
        if (!s.otpAt) data.otpAt = new Date();
        break;

      case "payment":
        if (!s.paidAt && body.paid) data.paidAt = new Date();
        data.copayCents = num(body.amountCents) ?? null;
        break;

      case "card":
        // Records only that they saw the capture demo. Deliberately no name,
        // email or practice: the read is canned, and writing canned identity
        // into the lead record would fill the CSV with the same fictional
        // person once per attendee.
        if (!s.cardAt) data.cardAt = new Date();
        break;

      case "identification":
        data.identification = JSON.stringify({
          captured: Boolean(body.captured),
          type: str(body.type) ?? "",
          number: str(body.number) ?? "",
          state: str(body.state) ?? "",
          expires: str(body.expires) ?? "",
          manual: Boolean(body.manual),
        });
        break;

      case "health":
        data.health = JSON.stringify({
          medications: arr(body.medications),
          conditions: arr(body.conditions),
          allergies: arr(body.allergies),
          confirmed: Boolean(body.confirmed),
        });
        break;

      case "questionnaire":
        // Answers are stored as given. Nothing here is scored, and nothing here
        // is a clinical instrument. It is the shape of the intake, not a
        // diagnosis, and the demo never pretends otherwise.
        data.questionnaire = JSON.stringify(
          typeof body.answers === "object" && body.answers !== null
            ? body.answers
            : {},
        );
        break;

      case "identity":
        data.identity = JSON.stringify({
          legalName: str(body.legalName) ?? "",
          dob: str(body.dob) ?? "",
        });
        break;

      case "insurance":
        // The photograph itself never leaves the phone. What is recorded is
        // the read: the same four fields a front desk would key in by hand.
        data.insurance = JSON.stringify({
          captured: Boolean(body.captured),
          manual: Boolean(body.manual),
          provider: str(body.provider) ?? "",
          memberId: str(body.memberId) ?? "",
          planType: str(body.planType) ?? "",
          groupNumber: str(body.groupNumber) ?? "",
          capturedAt: str(body.capturedAt) ?? new Date().toISOString(),
        });
        // Belt and braces: if the dedicated verify call never landed, the card
        // patch starts the check itself so the done screen still has a result.
        if (!s.verifyStartedAt && body.captured) startVerification = true;
        break;

      case "consent":
        data.consent = JSON.stringify({
          signedAt: str(body.signedAt) ?? new Date().toISOString(),
          reviewed: arr(body.reviewed),
          strokeCount: num(body.strokeCount) ?? 0,
          // A downsampled path so /staff can show the actual mark. Capped so a
          // long scribble cannot bloat the row.
          path: str(body.path) ?? "",
          typedName: str(body.typedName) ?? "",
        });
        break;

      case "finished":
        if (!s.finishedAt) {
          data.finishedAt = new Date();
          finishing = true;
        }
        // Client-measured, because it is immune to how long the network took.
        if (s.elapsedMs === null) data.elapsedMs = num(body.elapsedMs) ?? null;
        if (body.stepTimings) data.stepTimings = JSON.stringify(body.stepTimings);
        break;

      case "calc": {
        // Recomputed server-side. The client sends inputs, never the answer,
        // the number ends up in an SMS and on a shareable page, so it has to be
        // the one this codebase stands behind.
        const result = calculate({
          patientsPerDay: num(body.patientsPerDay),
          noShowRate: num(body.noShowRate),
          frontDeskStaff: num(body.frontDeskStaff),
          collectedRate: num(body.collectedRate),
        });
        data.calcInputs = JSON.stringify(result.inputs);
        data.calcResult = JSON.stringify({
          total: result.total,
          components: result.components,
        });
        if (!s.calcAt) data.calcAt = new Date();
        break;
      }

      case "stack": {
        const tools = arr(body.tools);
        data.techStack = JSON.stringify(tools);
        // The EHR is pulled out of the stack rather than asked for separately,
        // the benchmark and the CSV both want a single column for it.
        const ehr = tools.find((t) =>
          EHR_NAMES.has(t),
        );
        if (ehr) data.ehrSystem = ehr;
        const rival = tools.find((t) => COMPETITOR_TOOLS.has(t));
        data.competitorTool = rival ?? null;
        if (!s.qualifiedAt) data.qualifiedAt = new Date();
        break;
      }

      case "intakeCheck": {
        // Written even when empty: skipping is an answer, and a null here has
        // to be distinguishable from never having reached the screen.
        data.intakeSatisfaction = str(body.satisfaction) ?? null;
        data.painPoints = JSON.stringify(arr(body.painPoints));
        data.onlineBooking = Boolean(body.onlineBooking);
        data.asksForReviews = Boolean(body.asksForReviews);
        break;
      }

      case "booked": {
        // They picked a slot. Everyone without this stamp is the retargeting
        // list, which is the more useful half of the two.
        const slot = str(body.slot);
        if (slot) data.bookedSlot = slot;
        if (!s.bookingClickedAt) data.bookingClickedAt = new Date();
        break;
      }

      case "benchmark":
        // Asked after they have seen their own number, where "how does this
        // compare" is the question they are already asking.
        data.captureOptIn = Boolean(body.optIn);
        break;

      case "capture": {
        const pickedRole = str(body.role);
        if (
          pickedRole &&
          ["billing", "frontdesk", "owner", "other"].includes(pickedRole)
        ) {
          data.role = pickedRole;
          data.roleOther = str(body.roleOther) || null;
          if (!s.roleAt) data.roleAt = new Date();
        }
        const name = str(body.name);
        const title = str(body.title);
        const email = str(body.email);
        const practice = str(body.practice);
        const street = str(body.street);
        const unit = str(body.unit);
        const city = str(body.city);
        const stateCode = str(body.state);
        const zip = str(body.zip);
        if (name !== undefined) data.captureName = name;
        if (title !== undefined) data.captureTitle = title;
        if (email !== undefined) data.captureEmail = email;
        if (practice !== undefined) data.capturePractice = practice;
        if (street !== undefined) data.captureStreet = street;
        if (unit !== undefined) data.captureUnit = unit;
        if (city !== undefined) data.captureCity = city;
        if (stateCode !== undefined) data.captureState = stateCode;
        if (zip !== undefined) data.captureZip = zip;
        // One joined line as well, so the CSV has something a shipping tool or
        // a human can paste straight onto a label.
        const joined = [
          [street, unit].filter(Boolean).join(" "),
          city,
          [stateCode, zip].filter(Boolean).join(" "),
        ]
          .filter((part) => part && part.trim().length > 0)
          .join(", ");
        if (joined) data.captureAddress = joined;
        data.captureOptIn = Boolean(body.optIn);
        if (!s.capturedAt) data.capturedAt = new Date();
        break;
      }

      default:
        // Unknown keys are ignored rather than rejected: a stale queue in a
        // reloaded tab should never wedge on a key this build dropped.
        break;
    }
  }

  if (startVerification) {
    data.verifyStartedAt = new Date();
    data.verifyDurationMs = verificationDuration();
  }

  if (Object.keys(data).length > 0) {
    s = await prisma.session.update({ where: { id: s.id }, data });
  }

  if (finishing) {
    const persona = personaFor(s.personaIndex);
    const identity = parseJson<{ legalName?: string }>(s.identity, {});
    await ehrAppend(s, [
      `Intake received for ${identity.legalName || persona.legalName} at ${PRACTICE.name}`,
      `Demographics and contact reconciled to chart`,
      `Consent on file · signature captured`,
      `Coverage: ${VERIFY_RESULT.payer} ${VERIFY_RESULT.plan} · ${VERIFY_RESULT.status}`,
      `Chart updated, patient ready for rooming`,
    ]);
    s = await prisma.session.findUniqueOrThrow({ where: { id: s.id } });
  }

  return s;
}

/**
 * 6–9 seconds. Long enough that the room watches it work, short enough that it
 * has resolved by the time the attendee finishes the consent signature.
 */
export function verificationDuration(): number {
  return 6000 + Math.floor(Math.random() * 3000);
}
