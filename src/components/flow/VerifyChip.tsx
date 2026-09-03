"use client";

import { Check, Spinner } from "@/components/ui";
import type { VerifyState } from "./useVerify";

/**
 * The eligibility check, following the attendee down the flow.
 *
 * This is the beat the room is here for, so it stays on screen while they sign
 * rather than hiding behind a spinner on one step. Seconds are shown counting
 * because "eight seconds" is the claim being made.
 */
export function VerifyChip({ verify }: { verify: VerifyState }) {
  if (verify.status === "idle") return null;

  if (verify.status === "pending") {
    return (
      <div className="flex items-center gap-2.5 rounded-[12px] border border-hairline bg-white px-3 py-2.5">
        <Spinner className="h-4 w-4 shrink-0 text-teal" />
        <span className="text-[13px] font-semibold text-ink">
          Checking eligibility with Aetna
        </span>
        <span className="ml-auto text-[13px] font-bold tabular-nums text-ink-mute">
          {(verify.elapsedMs / 1000).toFixed(1)}s
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-[12px] border border-green/25 bg-green-bg px-3 py-2.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green text-white">
        <Check className="h-3 w-3" />
      </span>
      <span className="text-[13px] font-semibold text-ink">
        {verify.result?.payer} {verify.result?.status} · {verify.result?.copay}
      </span>
      {verify.elapsedMs > 0 ? (
        <span className="ml-auto text-[13px] font-bold tabular-nums text-green">
          {(verify.elapsedMs / 1000).toFixed(1)}s
        </span>
      ) : null}
    </div>
  );
}
