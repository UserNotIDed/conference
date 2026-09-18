import { calculate, growth, recovery, type CalcInputs } from "@/lib/calc";

/**
 * One set of figures, three ways of showing it.
 *
 * Every direction reads from here rather than computing its own, so what is
 * being compared is the layout and nothing else. If two of them ever showed
 * different money the comparison would be worthless.
 */
export function model(inputs: CalcInputs) {
  const leak = calculate(inputs);
  const back = recovery(leak);
  const up = growth(leak, {});
  const noShow = up.opportunities.find((o) => o.key === "noshow");

  // Per provider per month. Not a price, and never shown next to one, but it
  // is the unit the practice is sold in, so it is the unit that lets them do
  // the comparison themselves later without us quoting anything.
  const perProviderMonth = (annual: number) =>
    annual / inputs.providers / 12;

  const byKey = Object.fromEntries(back.lines.map((l) => [l.key, l.amount]));

  return {
    inputs,
    leak,
    back,
    up,
    noShowCost: noShow?.amount ?? 0,
    noShowBasis: noShow?.basis ?? "",
    perProviderMonth,
    /** What each component costs today and what is left after. */
    rows: leak.components.map((c) => ({
      key: c.key,
      label: c.label,
      today: c.amount,
      after: c.amount - (byKey[c.key] ?? 0),
      saved: byKey[c.key] ?? 0,
      formula: c.formula,
    })),
    afterTotal: leak.total - back.total,
  };
}

export type Model = ReturnType<typeof model>;
