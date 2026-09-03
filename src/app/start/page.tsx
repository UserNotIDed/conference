import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { newToken } from "@/lib/ids";

export const dynamic = "force-dynamic";

/**
 * Mint a fresh session and drop straight into it.
 *
 * The "hand the phone to the next person" path, and the fastest way to see the
 * flow from the top. It creates a new row rather than resetting an existing
 * one, so the previous person's lead is never destroyed — that is the whole
 * difference between this and ?restart=1, which is for testing a link you own.
 *
 * The phone number is a placeholder in the 555-01xx reserved range: the demo
 * runs end to end without one, you just cannot text the result afterwards.
 */
export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ practice?: string }>;
}) {
  const { practice } = await searchParams;

  const session = await prisma.session.create({
    data: {
      token: newToken(4),
      phone: `+1555${String(Date.now()).slice(-7)}`,
      source: "kiosk",
      keyword: "BOOTH",
      practiceName: practice?.slice(0, 120) ?? null,
      personaIndex: await prisma.session.count(),
    },
  });

  redirect(`/d/${session.token}`);
}
