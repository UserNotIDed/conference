import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { toClient } from "@/lib/session";
import { AttendeeFlow } from "@/components/flow/AttendeeFlow";

export const dynamic = "force-dynamic";

/**
 * The link in the text message.
 *
 * Server-rendered with the session already in hand so the first paint is the
 * first screen — no spinner, no client fetch, nothing for conference wifi to
 * lose between the tap and the timer starting.
 */
export default async function AttendeePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ practice?: string; restart?: string; resume?: string }>;
}) {
  const { token } = await params;
  const { practice, restart, resume } = await searchParams;

  const found = await prisma.session.findUnique({
    where: { token: token.toLowerCase() },
  });
  if (!found) notFound();

  /**
   * ?restart=1 wipes the run and starts at the first screen.
   *
   * Resuming is right for an attendee who locked their phone mid-flow, and
   * wrong for everyone testing, demoing or handing the same phone to a second
   * person — they open the link and land wherever the last run stopped. This
   * clears the progress but keeps the row, the phone number and the token, so
   * the link on the printed card and in the SMS keeps working.
   */
  if (restart) {
    await prisma.session.update({
      where: { id: found.id },
      data: {
        role: null,
        openedAt: null,
        startedAt: null,
        startedAtMs: null,
        roleAt: null,
        otpAt: null,
        cardAt: null,
        finishedAt: null,
        elapsedMs: null,
        stepTimings: null,
        techStack: null,
        ehrSystem: null,
        competitorTool: null,
        competitorSatisfaction: null,
        qualifiedAt: null,
        calcInputs: null,
        calcResult: null,
        calcAt: null,
        calcSmsAt: null,
        captureName: null,
        captureTitle: null,
        captureEmail: null,
        capturePractice: null,
        captureAddress: null,
        captureOptIn: false,
        capturedAt: null,
      },
    });
    redirect(`/d/${token.toLowerCase()}`);
  }

  // A rep can pre-set the practice name on the link they hand over; it is the
  // only field the capture screen starts with a value in.
  const session =
    practice && !found.practiceName
      ? await prisma.session.update({
          where: { id: found.id },
          data: { practiceName: practice.slice(0, 120) },
        })
      : found;

  // Opens at screen one every time. ?resume=1 picks up where they left off —
  // see initialStage for why that is the exception rather than the rule.
  return <AttendeeFlow session={toClient(session)} resume={Boolean(resume)} />;
}
