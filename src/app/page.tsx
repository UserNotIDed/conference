import Link from "next/link";
import QRCode from "qrcode";
import { STANDALONE } from "@/lib/mode";
import { blankSession } from "@/lib/blank-session";
import { AttendeeFlow } from "@/components/flow/AttendeeFlow";
import { PRACTICE } from "@/lib/demo";
import { formatPhone } from "@/lib/ids";

export const dynamic = "force-dynamic";

/**
 * The booth signage, and the page a rep leaves up on a spare screen.
 *
 * The QR encodes an `sms:` URI, not a URL. Phones route sms: to the messaging
 * app the same way they route tel: to the dialer, so scanning it opens a
 * pre-addressed thread with the keyword already typed, and the attendee still
 * has to press send, which is exactly right, because that tap is the consent.
 *
 * `?&body=` is not a typo. iOS historically wanted `&body=`, Android wanted
 * `?body=`, and `?&body=` is the form both parse. Keep the body short and plain:
 * punctuation, emoji and line breaks get dropped or mangled by some Android
 * skins. Scan the printed version on an iPhone and two Android handsets before
 * the file goes anywhere near a printer, because some devices drop the body entirely
 * and open a blank thread, which is survivable but changes the copy you need.
 */
export default async function BoothPage() {
  /**
   * On the standalone deployment the root *is* the microsite. That is also
   * where the QR-direct plan lands it, so this is not a detour: scanning the
   * code should open the first screen, not a page about scanning a code.
   */
  if (STANDALONE) {
    return <AttendeeFlow session={blankSession()} ephemeral />;
  }

  const number = process.env.BOOTH_SMS_NUMBER ?? PRACTICE.phone;
  // One keyword per show and event attribution comes for free.
  const keyword = process.env.BOOTH_KEYWORD ?? "DEMO";
  const smsUri = `sms:${number}?&body=${encodeURIComponent(keyword)}`;

  const qr = await QRCode.toString(smsUri, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#0A0B1A", light: "#00000000" },
  });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col justify-center px-8 py-12">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-teal">
        Yosi · Live demo
      </p>
      <h1 className="mt-3 text-[34px] font-extrabold leading-[1.08] tracking-[-0.025em] text-ink">
        Do your patient&apos;s intake in under a minute.
      </h1>
      <p className="mt-3 text-[15px] font-medium leading-[1.5] text-ink-sub">
        Scan, send the text, and we&apos;ll send the demo to your own phone. No app,
        no badge scan.
      </p>

      <div className="mt-8 rounded-[20px] border border-hairline bg-white p-7 shadow-[0_4px_24px_0_rgba(11,165,180,0.10)]">
        <div
          className="mx-auto aspect-square w-full max-w-[280px] [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: qr }}
          aria-hidden="true"
        />
        <p className="mt-6 text-center text-[14px] font-semibold text-ink">
          Or text{" "}
          <span className="font-extrabold">{keyword}</span> to{" "}
          <a href={`tel:${number}`} className="font-extrabold text-teal">
            {formatPhone(number)}
          </a>
        </p>
        <p className="mt-1.5 text-center text-[12px] text-ink-mute">
          Standard message rates apply. One text, then a link.
        </p>
      </div>

      <p className="mt-8 text-[12px] leading-[1.6] text-ink-mute">
        Everything in this demo is synthetic: the practice, the patient, the
        coverage. Nothing you enter is a real medical record.
      </p>

      <nav className="mt-6 flex flex-wrap gap-5 text-[13px] font-bold text-ink-sub">
        <Link href="/start" className="min-h-[44px] leading-[44px] text-teal">
          Run it on this device →
        </Link>
        <Link href="/preview" className="min-h-[44px] leading-[44px]">
          Every screen →
        </Link>
        <Link href="/admin" className="min-h-[44px] leading-[44px]">
          Admin →
        </Link>
      </nav>
    </main>
  );
}
