import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyPatches } from "@/lib/patch";

export const dynamic = "force-dynamic";

/**
 * sendBeacon target for a tab going into the background mid-flow. Same
 * semantics as PATCH, but it must return fast and can't be read by the client,
 * so it answers 204 and never echoes the session back.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const found = await prisma.session.findUnique({ where: { token } });
  if (!found) return new NextResponse(null, { status: 204 });
  try {
    const payload = await req.json();
    if (Array.isArray(payload?.patches))
      await applyPatches(found, payload.patches.slice(0, 20));
  } catch {
    /* a beacon that cannot be parsed is not worth a 400 nobody will read */
  }
  return new NextResponse(null, { status: 204 });
}
