import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/session";
import { PRACTICE } from "@/lib/demo";
import { usdRounded, pct } from "@/lib/calc";
import { baseUrl, sendSms } from "@/lib/sms";
import { BOOKING_URL } from "@/lib/prospect-content";

export const dynamic = "force-dynamic";

/**
 * Texts the leak estimate to the same number that started the demo.
 *
 * Deliberately not part of the retrying sync queue: a retried PATCH is
 * harmless, a retried SMS is two texts. calcSmsAt is the guard — the second
 * call is a no-op that reports success, so a double-tap on a laggy screen does
 * not send twice either.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const session = await prisma.session.findUnique({ where: { token } });
  if (!session) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (session.calcSmsAt) return NextResponse.json({ sent: true, already: true });

  const result = parseJson<{ total?: number } | null>(session.calcResult, null);
  const inputs = parseJson<{
    patientsPerDay?: number;
    noShowRate?: number;
    frontDeskStaff?: number;
  } | null>(session.calcInputs, null);
  if (!result?.total || !inputs) {
    return NextResponse.json({ error: "no_result" }, { status: 400 });
  }

  const practice = session.capturePractice || session.practiceName || "Your practice";
  const body = [
    `${practice} — here's your intake leak estimate.`,
    ``,
    `Estimated annual leak: ${usdRounded(result.total)}`,
    `${inputs.patientsPerDay} patients/day · ${pct(inputs.noShowRate ?? 0)} no-show · ${inputs.frontDeskStaff} front desk`,
    ``,
    `Full breakdown, with every assumption:`,
    `${baseUrl(req)}/r/${session.token}`,
    ``,
    // The booking link goes out with the number rather than waiting for a
    // follow-up nobody sends. Anyone who has still not opened it is the
    // retargeting list — see bookingClickedAt.
    `Want it on your own forms? ${BOOKING_URL}`,
    ``,
    `— ${PRACTICE.short} demo, Yosi`,
  ].join("\n");

  const { sent, detail } = await sendSms(session.phone, body);
  await prisma.session.update({
    where: { id: session.id },
    data: { calcSmsAt: new Date(), bookingSmsAt: new Date() },
  });
  return NextResponse.json({ sent, detail });
}
