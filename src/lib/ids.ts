import { randomBytes } from "node:crypto";

/**
 * Session tokens go in an SMS and get read aloud across a loud booth, so the
 * alphabet drops the characters that get misheard or mistyped: 0/O, 1/l/I, and
 * the vowels that let it spell something unfortunate.
 */
const ALPHABET = "23456789bcdfghjkmnpqrstvwxz";

export function newToken(len = 4): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/**
 * E.164-ish. Twilio hands us +1XXXXXXXXXX already; the kiosk fallback and the
 * admin screen hand us whatever a human typed.
 */
export function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}

export function formatPhone(e164: string): string {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164 || "");
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164 || "—";
}
