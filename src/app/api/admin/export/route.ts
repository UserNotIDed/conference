import { prisma } from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { toCsv } from "@/lib/csv";
import { toRow } from "@/lib/rows";
import { CSV_HEADERS, csvRow } from "@/lib/hubspot";

export const dynamic = "force-dynamic";

/**
 * Every lead, in HubSpot's own column names.
 *
 * Deliberately the same shape as the submit rather than a dump of our row
 * type: the file's whole reason to exist is that a booth with no signal, or a
 * form GUID that turns out to be wrong, does not lose the day's leads. Import
 * this straight onto the Contact object and the columns land on the properties
 * they were already going to land on.
 *
 * Sessions with no email are skipped, because HubSpot dedupes on email and a row
 * without one imports as a new contact every time.
 */
export async function GET() {
  const denied = await guardApi();
  if (denied) return denied;

  const sessions = await prisma.session.findMany({ orderBy: { createdAt: "asc" } });
  const rows = sessions
    .map(toRow)
    .filter((r) => r.captureEmail)
    .map(csvRow);

  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return new Response("﻿" + toCsv(CSV_HEADERS, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="yosi-booth-hubspot-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
