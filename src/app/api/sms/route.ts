import { prisma } from "@/lib/db";
import { newToken, normalizePhone } from "@/lib/ids";
import { PRACTICE } from "@/lib/demo";
import { baseUrl, twiml } from "@/lib/sms";

export const dynamic = "force-dynamic";

/**
 * Twilio inbound webhook.
 *
 * One session per phone number. Texting again does not start a second session —
 * it returns the same link, so someone who lost the message gets back to
 * exactly where they were rather than starting over on a 90-second clock.
 *
 * The body is the routing keyword. Print a different word per show and
 * attribution comes for free; it is also the fallback path for the phones that
 * strip the pre-filled body out of an sms: QR code.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const from = normalizePhone(String(form.get("From") ?? ""));
  const keyword = String(form.get("Body") ?? "").trim().slice(0, 60);

  if (!from) return twiml("We couldn't read your number — please try again.");

  const existing = await prisma.session.findUnique({ where: { phone: from } });
  const session =
    existing ??
    (await prisma.session.create({
      data: {
        token: await uniqueToken(),
        phone: from,
        source: "sms",
        keyword: keyword || null,
        personaIndex: await nextPersonaIndex(),
      },
    }));

  // A returning texter who used a new keyword gets it recorded, so a rep
  // handing out a role-specific card still gets the attribution.
  if (existing && keyword && existing.keyword !== keyword) {
    await prisma.session.update({
      where: { id: existing.id },
      data: { keyword },
    });
  }

  const link = `${baseUrl(req)}/d/${session.token}`;
  return twiml(
    `Welcome to ${PRACTICE.name}. Complete your intake before your visit:\n${link}\nTakes about 60 seconds.`,
  );
}

/** Twilio can be pointed here with GET while you are wiring it up. */
export async function GET() {
  return new Response("Yosi booth SMS webhook — POST only (Twilio).", {
    headers: { "Content-Type": "text/plain" },
  });
}

async function uniqueToken(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const token = newToken(i < 5 ? 4 : 5);
    if (!(await prisma.session.findUnique({ where: { token } }))) return token;
  }
  return newToken(8);
}

/** Round-robin the patient roster so /staff reads like a real queue. */
export async function nextPersonaIndex(): Promise<number> {
  return prisma.session.count();
}
