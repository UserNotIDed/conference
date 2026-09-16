import Link from "next/link";
import { STANDALONE_NOTICE } from "@/lib/mode";

/**
 * What a lead-data screen shows when there are no leads by design.
 *
 * A 404 here would read as "the deploy is broken" to whoever opened it, and
 * somebody always opens /admin. Saying plainly that nothing is stored is both
 * the truth and the reassurance sales needs before they run their own details
 * through it.
 */
export function StandaloneNotice({ screen }: { screen: string }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col justify-center px-6 py-16">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-teal">
        Yosi booth
      </p>
      <h1 className="mt-2 text-[26px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink">
        {screen} is off on this deployment
      </h1>
      <p className="mt-3 text-[14px] font-medium leading-[1.6] text-ink-sub">
        {STANDALONE_NOTICE}
      </p>
      <p className="mt-3 text-[14px] font-medium leading-[1.6] text-ink-sub">
        Run your own details through it as often as you like. Nothing is written
        down, nothing reaches HubSpot, and no card is ever charged.
      </p>
      <div className="mt-7 flex flex-wrap gap-2">
        <Link
          href="/"
          className="inline-flex min-h-[48px] items-center rounded-[14px] bg-blue px-5 text-[14px] font-bold text-white"
        >
          Start the check
        </Link>
        <Link
          href="/preview"
          className="inline-flex min-h-[48px] items-center rounded-[14px] border border-hairline bg-white px-5 text-[14px] font-bold text-ink"
        >
          Jump to any screen
        </Link>
        <Link
          href="/booth"
          className="inline-flex min-h-[48px] items-center rounded-[14px] border border-hairline bg-white px-5 text-[14px] font-bold text-ink"
        >
          The booth signage
        </Link>
        <Link
          href="/email"
          className="inline-flex min-h-[48px] items-center rounded-[14px] border border-hairline bg-white px-5 text-[14px] font-bold text-ink"
        >
          The follow-up email
        </Link>
      </div>
    </main>
  );
}
