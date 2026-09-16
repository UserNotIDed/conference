import { cookies } from "next/headers";

/**
 * The booth screens hold lead data, so they get a passcode when one is set.
 * Unset means open, which is right for a laptop on a table and wrong for a
 * public Vercel URL. See .env.example.
 */
export const PASSCODE = process.env.BOOTH_PASSCODE ?? "";
const COOKIE = "booth_pass";

export async function isUnlocked(): Promise<boolean> {
  if (!PASSCODE) return true;
  const jar = await cookies();
  return jar.get(COOKIE)?.value === PASSCODE;
}

export function unlockCookie(value: string) {
  return {
    name: COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 4, // the show plus a day
  };
}

/** Same gate for the JSON the booth screens poll. */
export async function guardApi(): Promise<Response | null> {
  if (await isUnlocked()) return null;
  return Response.json({ error: "locked" }, { status: 401 });
}
