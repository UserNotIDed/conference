"use client";

import { CapLabel } from "@/components/ui";
import { usd } from "@/lib/calc";
import type { Model } from "./shared";

/**
 * Direction 3: per provider, per month.
 *
 * The same arithmetic in the unit the practice is actually sold in. Nobody
 * signs an annual number; they approve a monthly one per provider, and that is
 * the frame the decision gets made in whatever we put on the screen.
 *
 * It does something the annual view cannot. When sales later says a number per
 * provider per month, the prospect has already been handed what intake costs
 * them in exactly those terms and does the comparison themselves. We never
 * quote a price, never divide by one, and the argument still lands, which is
 * the only version of an ROI claim that survives a public microsite.
 *
 * Six hundred thousand a year also reads as a number about somebody else's
 * practice. Twelve hundred a month per provider reads as a number about
 * theirs.
 */
export function PerProvider({ m }: { m: Model }) {
  const costPm = m.perProviderMonth(m.leak.total);
  const backPm = m.perProviderMonth(m.back.total);
  const noShowPm = m.perProviderMonth(m.noShowCost);
  const hoursPm = m.up.hoursFreed / m.inputs.providers / 12;

  return (
    <div className="px-5 py-6">
      <CapLabel>Per provider, per month</CapLabel>
      <div className="mt-2 flex items-end gap-2">
        <p className="text-[52px] font-extrabold leading-[0.9] tracking-[-0.04em] text-ink tabular-nums">
          {usd(backPm)}
        </p>
        <p className="pb-1.5 text-[15px] font-bold text-ink-sub">back</p>
      </div>
      <p className="mt-2.5 text-[14px] font-medium leading-[1.45] text-ink-sub">
        Intake costs you {usd(costPm)} per provider per month across{" "}
        {m.inputs.providers} providers. We take {usd(backPm)} of it off.
      </p>

      <div className="mt-6 space-y-2">
        <Row label="What intake costs you" value={usd(costPm)} muted />
        <Row label="What we take off" value={usd(backPm)} accent />
        <Row label="What is left" value={usd(costPm - backPm)} muted />
      </div>

      <div className="mt-5 rounded-[14px] border border-hairline bg-canvas p-4">
        <p className="text-[13px] font-semibold leading-[1.5] text-ink">
          And {hoursPm.toFixed(1)} front desk hours a month, per provider.
        </p>
        <p className="mt-1 text-[12.5px] leading-[1.45] text-ink-sub">
          Whatever you do with those is your call. We have not turned them into
          a revenue figure.
        </p>
      </div>

      <div className="mt-3 rounded-[14px] border border-amber-line bg-amber-bg p-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-bold text-ink">
            Separately: no-shows
          </span>
          <span className="shrink-0 text-[16px] font-extrabold tabular-nums text-ink">
            {usd(noShowPm)}
          </span>
        </div>
        <p className="mt-1 text-[12px] leading-[1.45] text-ink-sub">
          Per provider per month, and not in the figures above. Reminders and
          scheduling are what move it.
        </p>
      </div>

      <p className="mt-5 text-[12px] leading-[1.5] text-ink-mute">
        {usd(m.leak.total)} and {usd(m.back.total)} a year respectively, across
        the whole practice. An estimator, not an audit.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 rounded-[14px] border px-4 py-3.5 ${
        accent ? "border-teal/25 bg-teal-bg" : "border-hairline bg-white"
      }`}
    >
      <span
        className={`text-[13.5px] font-semibold ${muted ? "text-ink-sub" : "text-ink"}`}
      >
        {label}
      </span>
      <span
        className={`shrink-0 tabular-nums ${
          accent
            ? "text-[22px] font-extrabold text-ink"
            : "text-[17px] font-bold text-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
