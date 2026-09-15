import { renderEmail, presetById, type EmailMode } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * The email as a real document at a real URL.
 *
 * Served rather than injected into the preview page with srcdoc, for three
 * reasons: an iframe pointed at a URL behaves the way a mail client's own
 * renderer does, you can open it in a tab to see it at full width, and you can
 * hand the URL to someone who will not run the repo.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const preset = presetById(url.searchParams.get("preset"));
  const mode: EmailMode =
    url.searchParams.get("mode") === "hubspot" ? "hubspot" : "preview";

  const { html } = renderEmail(preset, mode);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
