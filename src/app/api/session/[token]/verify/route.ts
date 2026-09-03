import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verificationDuration } from "@/lib/patch";
import { ehrAppend, settleVerification, verificationState } from "@/lib/session";
import { VERIFY_RESULT } from "@/lib/demo";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

/** Kick off the faked eligibility check. Safe to call twice — the first start wins. */
export async function POST(_req: Request, { params }: Ctx) {
  const { token } = await params;
  const found = await prisma.session.findUnique({ where: { token } });
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let session = found;
  if (!session.verifyStartedAt) {
    session = await prisma.session.update({
      where: { id: session.id },
      data: { verifyStartedAt: new Date(), verifyDurationMs: verificationDuration() },
    });
    await ehrAppend(session, [
      `Eligibility 270 sent to ${VERIFY_RESULT.payer} — awaiting 271`,
    ]);
    session = await prisma.session.findUniqueOrThrow({ where: { id: session.id } });
  }

  const state = verificationState(session);
  return NextResponse.json(
    { status: state.status, remainingMs: state.remainingMs, durationMs: state.durationMs },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Poll. Cheap on purpose: the attendee is on the next screen while this runs. */
export async function GET(_req: Request, { params }: Ctx) {
  const { token } = await params;
  const found = await prisma.session.findUnique({ where: { token } });
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const session = await settleVerification(found);
  const state = verificationState(session);
  return NextResponse.json(
    {
      status: state.status,
      remainingMs: state.remainingMs,
      durationMs: state.durationMs,
      verifiedAt: session.verifiedAt?.toISOString() ?? null,
      result: state.status === "complete" ? VERIFY_RESULT : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
