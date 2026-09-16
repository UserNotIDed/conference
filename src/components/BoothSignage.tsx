import { ReadinessRing } from "@/components/ReadinessRing";
import { YosiLogo } from "@/components/YosiLogo";
import { SCORE_BANDS, TONE } from "@/lib/score";

/**
 * What stands on the table, and what gets printed.
 *
 * The QR points straight at the microsite. It used to encode an `sms:` URI so
 * the attendee texted us and we texted back a link, which cost two taps, a
 * carrier round trip and a phone number we now have no use for.
 *
 * It shows a worked score rather than describing one. "Check the health of
 * your practice" is a category of thing; a red 47 over the words AT RISK is a
 * question about their own practice they cannot answer from where they are
 * standing, which is the only reason anyone stops walking. The sample is
 * labelled as one, because a booth that fakes a result is a booth nobody
 * believes twice.
 */
export function BoothSignage({ url, qr }: { url: string; qr: string }) {
  const sample = 47;
  const band = SCORE_BANDS.find((b) => sample >= b.min)!;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[620px] flex-col justify-center px-8 py-12">
      <header className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-teal">
          Yosi
        </p>
        <YosiLogo className="h-7" />
      </header>

      <h1 className="mt-6 text-[38px] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink">
        Check the health of your practice.
      </h1>
      <p className="mt-3 text-[16px] font-medium leading-[1.5] text-ink-sub">
        Four questions about your front desk. Ninety seconds. You get a score,
        the arithmetic behind it, and what fixing it is worth in your own
        numbers.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        {/* The payoff, shown rather than promised. */}
        <div className="rounded-[20px] border border-hairline bg-white p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-mute">
            What you get
          </p>
          <div className="mt-3 flex items-center gap-4">
            <ReadinessRing
              percent={sample}
              size={104}
              tone={band.tone}
              display={String(sample)}
              caption={band.label}
            />
            <div className="min-w-0">
              <p className="text-[15px] font-extrabold leading-[1.2] tracking-[-0.01em] text-ink">
                Your practice scores{" "}
                <span style={{ color: TONE[band.tone].solid }}>{sample}</span>
              </p>
              <p className="mt-1.5 text-[13px] font-medium leading-[1.45] text-ink-sub">
                {band.blurb}
              </p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-pale">
                Sample result
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-1.5 border-t border-hairline pt-4">
            <Line text="How many patients actually turn up" />
            <Line text="What your front desk spends on registration" />
            <Line text="What all of it costs you in a year" />
          </div>
        </div>

        <div className="rounded-[20px] border border-hairline bg-white p-6 text-center">
          <div
            className="mx-auto aspect-square w-full max-w-[200px] [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qr }}
            aria-hidden="true"
          />
          <p className="mt-4 text-[14px] font-extrabold text-ink">Scan it</p>
          <p className="mt-1 text-[12px] leading-[1.45] text-ink-mute">
            No app, no badge scan, no sign-up.
            <br />
            <span className="font-semibold text-ink-sub">{url.replace(/^https?:\/\//, "")}</span>
          </p>
        </div>
      </div>

      <p className="mt-8 text-[12px] leading-[1.6] text-ink-mute">
        The figures are an estimate built from your four answers and a set of
        assumptions we print on the screen next to them. Nothing clinical is
        asked and nothing about your patients is collected.
      </p>
    </main>
  );
}

function Line({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
      <span className="text-[13px] font-medium leading-[1.45] text-ink-sub">
        {text}
      </span>
    </div>
  );
}
