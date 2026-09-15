"use client";

import { useId } from "react";
import { TONE, type ScoreTone } from "@/lib/score";

/**
 * The ring from the Yosi hub, doing two jobs.
 *
 * On the landing page it is progress: how much of the check is done. On the
 * diagnosis it is the practice health score. Same element either way, because
 * a prospect who later sees the real product should recognise it — and because
 * one number in a ring is the fastest thing on the screen to read.
 *
 * Three things make it read as the Yosi one rather than a generic donut: the
 * stroke is thick enough to be a wheel rather than a hairline, the arc has
 * rounded caps so it looks drawn rather than clipped, and the fill is a
 * two-stop gradient of its band's hue. The gradient is not decoration — at 16%
 * of the diameter there is enough stroke to carry it, and a flat fill at that
 * weight looks like a placeholder.
 *
 * Colour is the second channel, and the whole point of it: an At risk 41 is
 * red before anyone has read the word underneath. The four bands live in
 * score.ts so the ring, the dimension bars and the follow-up email cannot
 * disagree about what 64 looks like.
 */
export type RingTone = ScoreTone | "progress";

/** Progress is not a health score, so it gets its own pair: blue, green at 100. */
const PROGRESS = { from: "#60a5fa", to: "#1d4ed8" };
const PROGRESS_DONE = TONE.good;

const TRACK = "#eef2f6";

export function ReadinessRing({
  percent,
  size = 104,
  tone = "progress",
  display,
  caption,
}: {
  /** 0–100. Drives the arc. */
  percent: number;
  size?: number;
  tone?: RingTone;
  /** What sits in the middle. Defaults to the percentage. */
  display?: string;
  /** Small caps line under the ring, coloured by the band. */
  caption?: string;
}) {
  // Unique per instance: two rings on one page sharing a gradient id means the
  // second one silently paints with the first one's colours.
  const gradientId = useId();
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const stroke = Math.round(size * 0.16);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  const colours =
    tone === "progress" ? (pct >= 100 ? PROGRESS_DONE : PROGRESS) : TONE[tone];

  return (
    <div className="flex shrink-0 flex-col items-center">
      <div
        className="relative"
        style={{ width: size, height: size }}
        role="img"
        aria-label={
          display
            ? `${display}${caption ? `, ${caption}` : ""}`
            : `${pct} percent`
        }
      >
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            {/* Diagonal so the light end sits where the arc starts, which is
                the top once the -90 rotation is applied. */}
            <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor={colours.from} />
              <stop offset="100%" stopColor={colours.to} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            stroke={TRACK}
          />
          {pct > 0 ? (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              stroke={`url(#${gradientId})`}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct / 100)}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          ) : null}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums"
            style={{ fontSize: Math.round(size * 0.27) }}
          >
            {display ?? (
              <>
                {pct}
                <span style={{ fontSize: Math.round(size * 0.17) }}>%</span>
              </>
            )}
          </span>
        </div>
      </div>
      {caption ? (
        <span
          className="mt-2 text-center font-bold uppercase leading-[1.2] tracking-[0.06em]"
          style={{
            fontSize: Math.max(9, Math.round(size * 0.095)),
            color: tone === "progress" ? "#94a3b8" : TONE[tone].solid,
          }}
        >
          {caption}
        </span>
      ) : null}
    </div>
  );
}
