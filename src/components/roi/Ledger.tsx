"use client";

import { CapLabel } from "@/components/ui";
import { usd, usdRounded } from "@/lib/calc";
import type { Model } from "./shared";

/**
 * Direction 1: the ledger.
 *
 * Two columns, today and after, line by line, with the difference as the
 * bottom line. No rhetoric anywhere in it: it reads like something their
 * accountant produced rather than something a vendor did, which is the point.
 *
 * Strongest for an owner or a CFO, who will read a table before they read a
 * sentence. Weakest on a phone in a loud room, because it asks you to compare
 * two columns rather than read one number.
 */
export function Ledger({ m }: { m: Model }) {
  return (
    <div className="px-5 py-6">
      <CapLabel>What intake costs you</CapLabel>
      <h1 className="mt-1.5 text-[24px] font-extrabold leading-[1.15] tracking-[-0.025em] text-ink">
        Today, and with Yosi
      </h1>

      <table className="mt-5 w-full border-collapse">
        <thead>
          <tr className="border-b border-hairline">
            <th className="pb-2 text-left text-[10px] font-bold uppercase tracking-[0.05em] text-ink-mute">
              A year
            </th>
            <th className="pb-2 text-right text-[10px] font-bold uppercase tracking-[0.05em] text-ink-mute">
              Today
            </th>
            <th className="pb-2 text-right text-[10px] font-bold uppercase tracking-[0.05em] text-teal">
              With us
            </th>
          </tr>
        </thead>
        <tbody>
          {m.rows.map((r) => (
            <tr key={r.key} className="border-b border-hairline/70">
              <td className="py-2.5 pr-2 text-[13px] font-semibold leading-[1.3] text-ink">
                {r.label}
              </td>
              <td className="py-2.5 text-right text-[13.5px] font-medium tabular-nums text-ink-sub">
                {usd(r.today)}
              </td>
              <td className="py-2.5 pl-2 text-right text-[13.5px] font-bold tabular-nums text-ink">
                {r.after < 1 ? "0" : usd(r.after)}
              </td>
            </tr>
          ))}
          <tr className="border-b-2 border-ink">
            <td className="py-3 text-[13px] font-extrabold uppercase tracking-[0.04em] text-ink">
              Total
            </td>
            <td className="py-3 text-right text-[15px] font-extrabold tabular-nums text-ink-sub">
              {usd(m.leak.total)}
            </td>
            <td className="py-3 pl-2 text-right text-[15px] font-extrabold tabular-nums text-ink">
              {usd(m.afterTotal)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-4 rounded-[16px] border border-teal/25 bg-teal-bg p-4">
        <CapLabel>The difference</CapLabel>
        <p className="mt-1 text-[36px] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
          {usdRounded(m.back.total)}
        </p>
        <p className="mt-1.5 text-[13px] font-medium leading-[1.45] text-ink-sub">
          A year, plus {Math.round(m.up.hoursFreed).toLocaleString("en-US")}{" "}
          front desk hours. Nothing above is netted against what we cost.
        </p>
      </div>

      <div className="mt-3 rounded-[14px] border border-amber-line bg-amber-bg p-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-bold text-ink">
            Not in the table: no-shows
          </span>
          <span className="shrink-0 text-[16px] font-extrabold tabular-nums text-ink">
            {usd(m.noShowCost)}
          </span>
        </div>
        <p className="mt-1 text-[12px] leading-[1.45] text-ink-sub">
          Reminders and scheduling move this one. We show the cost and claim no
          share of it.
        </p>
      </div>
    </div>
  );
}
