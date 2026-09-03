import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { settleVerification } from "@/lib/session";
import { toRow } from "@/lib/rows";

export const dynamic = "force-dynamic";

/**
 * The front desk board, polled every two seconds.
 *
 * Nobody at a booth can tell a three-second poll from a socket, and a poll
 * cannot get itself into a state where it is silently disconnected for the rest
 * of the show — which is the failure mode that actually loses the demo.
 */
export async function GET() {
  const denied = await guardApi();
  if (denied) return denied;

  const sessions = await prisma.session.findMany({
    where: { OR: [{ startedAt: { not: null } }, { finishedAt: { not: null } }] },
    orderBy: { updatedAt: "desc" },
    take: 40,
  });

  // Settle any eligibility checks whose clock ran out while nobody was looking,
  // so the board shows "verified" even if the attendee's phone went to sleep.
  const settled = await Promise.all(
    sessions.map((s) => (s.verifyStartedAt && !s.verifiedAt ? settleVerification(s) : s)),
  );

  const rows = settled.map(toRow);
  const arrived = rows
    .filter((r) => r.finishedAt)
    .sort((a, b) => (a.finishedAt! < b.finishedAt! ? 1 : -1));
  const inProgress = rows
    .filter((r) => !r.finishedAt)
    .sort((a, b) => (a.startedAt! < b.startedAt! ? 1 : -1));

  return NextResponse.json(
    { arrived, inProgress, now: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
