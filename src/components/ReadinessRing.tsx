/**
 * The ring from the Yosi hub, doing two jobs.
 *
 * On the landing page it is progress: how much of the check is done. On the
 * diagnosis it is the practice health score. Same element either way, because
 * a prospect who later sees the real product should recognise it — and because
 * one number in a ring is the fastest thing on the screen to read.
 *
 * Colour is the second channel. Progress goes blue then green at 100; the
 * score is banded, so a 48 is red before anyone has read the word under it.
 */
export type RingTone = "progress" | "good" | "ok" | "warn" | "bad";

const STROKE: Record<RingTone, string> = {
  progress: "stroke-blue",
  good: "stroke-green",
  ok: "stroke-teal",
  warn: "stroke-amber-strong",
  bad: "stroke-red",
};

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
  /** Small line under the figure, inside the ring. */
  caption?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const stroke = Math.round(size * 0.105);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const colour =
    tone === "progress" && pct >= 100 ? "stroke-green" : STROKE[tone];

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={display ? `${display}${caption ? ` ${caption}` : ""}` : `${pct} percent`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-hairline"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          className={`transition-[stroke-dashoffset] duration-700 ease-out ${colour}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums"
          style={{ fontSize: Math.round(size * 0.28) }}
        >
          {display ?? (
            <>
              {pct}
              <span style={{ fontSize: Math.round(size * 0.16) }}>%</span>
            </>
          )}
        </span>
        {caption ? (
          <span
            className="mt-1 font-bold uppercase tracking-[0.06em] text-ink-mute"
            style={{ fontSize: Math.max(8, Math.round(size * 0.085)) }}
          >
            {caption}
          </span>
        ) : null}
      </div>
    </div>
  );
}
