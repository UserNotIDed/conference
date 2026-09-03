import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyPatches } from "@/lib/patch";
import { settleVerification, toClient } from "@/lib/session";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { token } = await params;
  const found = await prisma.session.findUnique({ where: { token } });
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const session = await settleVerification(found);
  return NextResponse.json(toClient(session), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { token } = await params;
  const found = await prisma.session.findUnique({ where: { token } });
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let payload: { patches?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  if (!Array.isArray(payload.patches)) {
    return NextResponse.json({ error: "patches_required" }, { status: 400 });
  }

  const session = await applyPatches(found, payload.patches.slice(0, 20));
  return NextResponse.json(toClient(await settleVerification(session)), {
    headers: { "Cache-Control": "no-store" },
  });
}
