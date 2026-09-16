import type { Row } from "./rows";
import { ROLES } from "./demo";

/**
 * The front desk benchmark, computed from the show's own sessions.
 *
 * This is the thing the opt-in checkbox promises, so it is worth being able to
 * read it before anyone leaves the venue: patients per day, no-show rate and
 * front desk headcount, by role, across everyone who ran the demo. Medians
 * rather than means, because one enterprise MSO answering "150 patients a day"
 * should not move the number everyone else is compared against.
 */

export type Benchmark = {
  n: number;
  patientsPerDay: number | null;
  noShowRate: number | null;
  frontDeskStaff: number | null;
  patientsPerStaff: number | null;
  leak: number | null;
};

function median(values: number[]): number | null {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function benchmark(rows: Row[]): Benchmark {
  const withCalc = rows.filter((r) => r.calcInputs?.patientsPerDay);
  const perDay = withCalc.map((r) => r.calcInputs!.patientsPerDay!);
  const staff = withCalc.map((r) => r.calcInputs!.frontDeskStaff!);

  return {
    n: withCalc.length,
    patientsPerDay: median(perDay),
    noShowRate: median(withCalc.map((r) => r.calcInputs!.noShowRate!)),
    frontDeskStaff: median(staff),
    // The ratio is the actual benchmark line: "you are running 18 patients per
    // person at the desk; the median here is 14" is a sentence someone repeats
    // to their boss. The two raw numbers on their own are not.
    patientsPerStaff: median(
      withCalc
        .filter((r) => (r.calcInputs!.frontDeskStaff ?? 0) > 0)
        .map((r) => r.calcInputs!.patientsPerDay! / r.calcInputs!.frontDeskStaff!),
    ),
    leak: median(
      withCalc
        .map((r) => r.calcTotal)
        .filter((v): v is number => typeof v === "number"),
    ),
  };
}

export function benchmarkByRole(rows: Row[]) {
  return ROLES.map((role) => ({
    role,
    stats: benchmark(rows.filter((r) => r.role === role.id)),
  }));
}
