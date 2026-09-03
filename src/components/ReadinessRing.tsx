/**
 * The readiness score from the Yosi hub.
 *
 * Two channels in one element: how far along (arc length) and whether it is
 * finished (colour). Teal while there is work left, green at 100 — the same
 * mapping the patient hub uses, so a prospect who later sees the real product
 * recognises it.
 */
export function ReadinessRing({
  percent,
  size = 104,
}: {
  percent: number;
  size?: number;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const stroke = 11;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const done = pct >= 100;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Readiness score ${pct} percent`}
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
          className={`transition-[stroke-dashoffset] duration-500 ease-out ${
            done ? "stroke-green" : "stroke-blue"
          }`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[24px] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
          {pct}
          <span className="text-[15px]">%</span>
        </span>
      </div>
    </div>
  );
}
