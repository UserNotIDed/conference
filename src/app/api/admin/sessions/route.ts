import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { newToken, normalizePhone } from "@/lib/ids";
import { toRow } from "@/lib/rows";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardApi();
  if (denied) return denied;
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json(
    { rows: sessions.map(toRow), count: sessions.length },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * Manual session creation: the "something went sideways" path.
 *
 * If Twilio is down, the number is rate limited, or someone will not text a
 * stranger's booth, a rep types a phone number here (or none at all) and hands
 * over the link. Same flow, same records, same CSV.
 */
export async function POST(req: Request) {
  const denied = await guardApi();
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const phone =
    normalizePhone(String(body.phone ?? "")) || `+1555${String(Date.now()).slice(-7)}`;
  const practiceName = String(body.practiceName ?? "").slice(0, 120) || null;

  const existing = await prisma.session.findUnique({ where: { phone } });
  if (existing) {
    const updated = practiceName
      ? await prisma.session.update({
          where: { id: existing.id },
          data: { practiceName },
        })
      : existing;
    return NextResponse.json({ row: toRow(updated), created: false });
  }

  const session = await prisma.session.create({
    data: {
      token: newToken(4),
      phone,
      source: "kiosk",
      keyword: "BOOTH",
      practiceName,
      personaIndex: await prisma.session.count(),
    },
  });
  return NextResponse.json({ row: toRow(session), created: true });
}

/** Rep pre-fill of the practice name on an existing session. */
export async function PATCH(req: Request) {
  const denied = await guardApi();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? "");
  const practiceName = String(body.practiceName ?? "").slice(0, 120);
  const found = await prisma.session.findUnique({ where: { token } });
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const updated = await prisma.session.update({
    where: { id: found.id },
    data: { practiceName: practiceName || null },
  });
  return NextResponse.json({ row: toRow(updated) });
}
