import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/session";
import {
  ASSUMPTIONS,
  clampInputs,
  type CalcInputs,
  calculate,
  orderComponents,
  pct,
  roleLead,
  usd,
  usdRounded,
} from "@/lib/calc";
import { PRACTICE, roleLabel } from "@/lib/demo";

export const dynamic = "force-dynamic";

/**
 * The breakdown behind the texted number.
 *
 * This is what gets opened on a laptop two weeks later, so it is a plain
 * server-rendered page with no JavaScript at all, because it has to load on an
 * airport connection and it has to survive being forwarded to a CFO. Every
 * assumption is on it, which is the same reason the phone screen shows them:
 * an argument about the inputs is a conversation, a dismissal is not.
 */
export default async function BreakdownPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await prisma.session.findUnique({
    where: { token: token.toLowerCase() },
  });
  if (!session?.calcInputs) notFound();

  // Run through the same clamp the flow uses, so a record written before a
  // question existed still produces the model's defaults rather than NaN.
  const inputs = clampInputs(
    parseJson<Partial<CalcInputs>>(session.calcInputs, {}),
  );

  const result = calculate(inputs);
  const ordered = orderComponents(result, session.role);
  const lead = roleLead(result, session.role);
  const practice = session.capturePractice || session.practiceName || "Your practice";

  return (
    <main className="mx-auto w-full max-w-[680px] px-6 py-12">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-mute">
        {practice}
      </p>
      <h1 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.025em] text-ink sm:text-[40px]">
        Estimated annual intake leak
      </h1>
      <p className="mt-5 text-[56px] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums sm:text-[68px]">
        {usdRounded(result.total)}
      </p>
      {lead ? (
        <p className="mt-3 text-[15px] font-medium text-ink-sub">
          {lead} You told us you&apos;re on the{" "}
          {roleLabel(session.role).toLowerCase()} side.
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-mute">
          Where it comes from
        </h2>
        <div className="mt-4 space-y-3">
          {ordered.map((c) => (
            <div
              key={c.key}
              className="rounded-[16px] border border-hairline bg-white p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <span className="text-[16px] font-semibold text-ink">{c.label}</span>
                <span className="text-[20px] font-extrabold tabular-nums text-ink">
                  {usd(c.amount)}
                </span>
              </div>
              <p className="mt-2 text-[13px] font-medium text-ink-mute">{c.formula}</p>
              {c.note ? (
                <p className="mt-2 text-[14px] leading-[1.55] text-ink-sub">{c.note}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-mute">
          What you told us
        </h2>
        <dl className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="Patients / day" value={String(inputs.patientsPerDay)} />
          <Stat label="No-show rate" value={pct(inputs.noShowRate)} />
          <Stat label="Front desk" value={String(inputs.frontDeskStaff)} />
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-mute">
          What we assumed
        </h2>
        <p className="mt-3 text-[14px] leading-[1.6] text-ink-sub">
          Two of these are ours rather than yours: net revenue per visit and the
          loaded hourly cost of your front desk. Both are set conservatively. If
          your numbers are different, the arithmetic below is simple enough to
          redo with them.
        </p>
        <div className="mt-4 divide-y divide-hairline rounded-[16px] border border-hairline bg-white px-5">
          {Object.values(ASSUMPTIONS).map((a) => (
            <div key={a.label} className="py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <span className="text-[14px] font-semibold text-ink">{a.label}</span>
                <span className="text-[14px] font-bold tabular-nums text-ink">
                  {a.display}
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-mute">
                {a.source}
              </p>
            </div>
          ))}
        </div>
        {result.staffCapped ? (
          <p className="mt-4 rounded-[14px] border border-amber-line bg-amber-bg p-4 text-[13px] leading-[1.55] text-amber-dk">
            The staff-time figure was capped at what {inputs.frontDeskStaff}{" "}
            full-time front desk staff are actually paid for. The raw calculation
            came out higher, which usually means the manual-entry estimate is too
            high for your setup, and worth a conversation.
          </p>
        ) : null}
      </section>

      <footer className="mt-12 border-t border-hairline pt-6">
        <p className="text-[13px] leading-[1.6] text-ink-mute">
          Generated from what you entered at the {PRACTICE.short} demo booth. This
          is an estimate for discussion, not a quote or a guarantee of savings.
        </p>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-hairline bg-white p-4">
      <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-mute">
        {label}
      </dt>
      <dd className="mt-1.5 text-[22px] font-extrabold tabular-nums tracking-[-0.02em] text-ink">
        {value}
      </dd>
    </div>
  );
}
