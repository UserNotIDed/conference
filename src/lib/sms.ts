import { PRACTICE } from "./demo";

/**
 * Outbound SMS. Real when Twilio credentials are present, logged when they are
 * not, so the whole flow, including the texted leak estimate, still runs on a
 * laptop with no account attached.
 */
export async function sendSms(
  to: string,
  body: string,
): Promise<{ sent: boolean; detail: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM ?? PRACTICE.phone;

  if (!sid || !token) {
    console.log(`[sms:dry-run] to=${to} from=${from}\n${body}`);
    return { sent: false, detail: "dry-run (no Twilio credentials)" };
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    },
  );
  if (!res.ok) {
    const detail = await res.text();
    console.error(`[sms:error] ${res.status} ${detail}`);
    return { sent: false, detail: `twilio ${res.status}` };
  }
  return { sent: true, detail: "twilio accepted" };
}

export function twiml(message: string): Response {
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`,
    { headers: { "Content-Type": "text/xml; charset=utf-8" } },
  );
}

/**
 * The public origin. Twilio needs an absolute link and Vercel gives us the host
 * on the request, so we prefer an explicit env var and fall back to the header.
 */
export function baseUrl(req: Request): string {
  const explicit = process.env.PUBLIC_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}
