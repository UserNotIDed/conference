"use client";

import { CapLabel } from "@/components/ui";
import { usd, usdRounded } from "@/lib/calc";
import { TONE } from "@/lib/score";
import type { Model } from "./shared";

/**
 * Direction 2: one bar.
 *
 * The share of the problem we fix is the question every reader has and the one
 * a list of figures answers slowest. A filled bar answers it before anybody
 * has read a word, and it makes the honest version of the answer, roughly
 * seven tenths, look like the strength it is rather than something we hope
 * nobody works out.
 *
 * The no-show bar sits outside the frame on purpose: same scale, visibly not
 * part of the total, so the eye does the disclaimer.
 */
export function Bar({ m }: { m: Model }) {
  const pctBack = Math.round((m.back.total / m.leak.total) * 100);

  return (
    <div className="px-5 py-6">
      <CapLabel>What Yosi puts back</CapLabel>
      <p className="mt-1.5 text-[46px] font-extrabold leading-none tracking-[-0.035em] text-ink tabular-nums">
        {usdRounded(m.back.total)}
      </p>
      <p className="mt-2 text-[14px] font-medium leading-[1.45] text-ink-sub">
        {pctBack}% of what intake costs you. The rest is real and we do not
        claim it.
      </p>

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-ink-mute">
            Intake costs you
          </span>
          <span className="text-[13px] font-extrabold tabular-nums text-ink">
            {usd(m.leak.total)}
          </span>
        </div>
        {/* Full width. An earlier version scaled this against the no-show
            figure so the two bars could be compared honestly, and the result
            was a hero bar at 40% width next to a no-show bar at 100%: an
            accurate picture that made the thing we sell look like the small
            one. The chart does one job now, which is the split inside the
            leak, and no-shows get a figure rather than a bar. */}
        <div className="mt-2 flex h-[38px] overflow-hidden rounded-[10px] bg-hairline">
          <div
            className="flex items-center justify-start pl-3 transition-[width] duration-700 ease-out"
            style={{
              width: `${pctBack}%`,
              backgroundImage: `linear-gradient(90deg, ${TONE.ok.from}, ${TONE.ok.to})`,
            }}
          >
            <span className="text-[12px] font-extrabold text-white">
              {pctBack}%
            </span>
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
          <Key colour={TONE.ok.solid} label={`We remove ${usd(m.back.total)}`} />
          <Key colour="#e2e8f0" label={`Stays ${usd(m.afterTotal)}`} dark />
        </div>
      </div>

      <div className="mt-6 border-t border-hairline pt-5">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-amber-dk">
            Separately: no-shows
          </span>
          <span className="text-[13px] font-extrabold tabular-nums text-ink">
            {usd(m.noShowCost)}
          </span>
        </div>
        <p className="mt-1.5 text-[12px] font-medium leading-[1.4] text-ink-mute">
          {m.noShowBasis}
        </p>
        <p className="mt-2 text-[12.5px] leading-[1.45] text-ink-sub">
          Bigger than everything above it, and not in the bar. Reminders and
          scheduling are what move a no-show rate; we show the cost and put no
          recovery figure on it.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2.5">
        <Tile label="Desk hours back a year" value={Math.round(m.up.hoursFreed).toLocaleString("en-US")} />
        <Tile
          label="Left after we are done"
          value={usdRounded(m.afterTotal)}
        />
      </div>
    </div>
  );
}

function Key({
  colour,
  label,
  dark,
}: {
  colour: string;
  label: string;
  dark?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-[3px]"
        style={{ background: colour }}
      />
      <span
        className={`text-[11.5px] font-semibold ${dark ? "text-ink-mute" : "text-ink-sub"}`}
      >
        {label}
      </span>
    </span>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-hairline bg-white p-3.5">
      <p className="min-h-[26px] text-[10px] font-bold uppercase leading-[1.3] tracking-[0.05em] text-ink-mute">
        {label}
      </p>
      <p className="mt-1.5 text-[20px] font-extrabold leading-none tracking-[-0.02em] text-ink tabular-nums">
        {value}
      </p>
    </div>
  );
}
