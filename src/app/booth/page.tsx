import { headers } from "next/headers";
import QRCode from "qrcode";
import { BoothSignage } from "@/components/BoothSignage";

export const dynamic = "force-dynamic";

/**
 * The signage, at a fixed address so it is reachable whatever `/` is doing.
 *
 * On the standalone deployment `/` is the microsite itself, which is where the
 * QR points; this is the page you put on the spare screen or send to print.
 */
export default async function BoothSignagePage() {
  // The printed QR has to carry the public origin, not whatever the laptop
  // rendering it happens to be on. A QR pointing at localhost is the kind of
  // mistake you only find out about at the show.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:4000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const url = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "") ?? `${proto}://${host}`;

  const qr = await QRCode.toString(url, {
    type: "svg",
    // H, not M: the printed version gets a logo dropped on it, and it gets
    // scanned across a metre of trade show carpet in bad light.
    errorCorrectionLevel: "H",
    margin: 0,
    color: { dark: "#0A0B1A", light: "#00000000" },
  });

  return <BoothSignage url={url} qr={qr} />;
}
