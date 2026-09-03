import { NextResponse } from "next/server";
import { PASSCODE, unlockCookie } from "@/lib/guard";

export async function POST(req: Request) {
  const form = await req.formData();
  const supplied = String(form.get("passcode") ?? "");
  const next = String(form.get("next") ?? "/staff");
  const dest = next.startsWith("/") ? next : "/staff";

  if (!PASSCODE || supplied !== PASSCODE) {
    return NextResponse.redirect(new URL(`${dest}?bad=1`, req.url), 303);
  }
  const res = NextResponse.redirect(new URL(dest, req.url), 303);
  res.cookies.set(unlockCookie(supplied));
  return res;
}
