import { isUnlocked, PASSCODE } from "@/lib/guard";
import { Passcode } from "@/components/Passcode";
import { Discovery } from "@/components/discovery/Discovery";

export const dynamic = "force-dynamic";

/**
 * The pre-call discovery readout. Sales only.
 *
 * Gated even on the standalone deployment, which the rest of the booth is
 * not: the booth flow is meant to be found by a prospect and this is meant
 * not to be. If BOOTH_PASSCODE is unset it says so rather than quietly
 * serving an internal tool to the open internet.
 */
export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ bad?: string }>;
}) {
  const { bad } = await searchParams;

  if (!PASSCODE) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col justify-center px-6">
        <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-ink">
          This one needs a passcode set
        </h1>
        <p className="mt-3 text-[14px] leading-[1.6] text-ink-sub">
          The discovery readout carries pricing and is for reps, not prospects.
          It will not serve without <code>BOOTH_PASSCODE</code> set on the
          deployment. Add it in Vercel and redeploy.
        </p>
      </main>
    );
  }

  if (!(await isUnlocked())) {
    return <Passcode next="/discovery" bad={Boolean(bad)} />;
  }
  return <Discovery />;
}
