/**
 * The follow-up email, as HTML.
 *
 * Two renders from one template:
 *
 *   mode "preview"  real values, for looking at. `/email` shows this.
 *   mode "hubspot"  the same HTML with {{ contact.booth_* }} personalization
 *                     tokens in place of the values, to paste into a HubSpot
 *                     marketing email.
 *
 * One template rather than two because a preview that is not the thing you
 * paste is a preview of nothing. Every token maps to a property in hubspot.ts,
 * so if a field is not in that spec it cannot appear here.
 *
 * Email HTML rules this obeys, because Outlook and Gmail are not browsers:
 * tables for layout, inline styles only, no flex, no grid, no SVG, no web
 * fonts, no background images, 600px wide, and anything that relies on
 * border-radius degrades to a square rather than breaking.
 */

import {
  ASSUMPTIONS,
  INPUT_DEFAULTS,
  RECOVERY,
  calculate,
  growth,
  recovery,
  usd,
  usdRounded,
} from "./calc";
import { TONE, biggestGap, score, toneFor, type ScoreResult } from "./score";
import type { CalcInputs } from "./calc";
import { BOOKING_URL } from "./booking";

const INK = "#0f172a";
const SUB = "#475569";
const MUTE = "#94a3b8";
const HAIRLINE = "#e2e8f0";
const CANVAS = "#f8fafc";
const TEAL = "#0ba5b4";
const TEAL_BG = "#ecfeff";
const BLUE = "#2563eb";

export type EmailMode = "preview" | "hubspot";

/**
 * The people we render it for. Shared by the preview UI and the route that
 * serves the HTML, so the thing you look at and the thing you open in a new
 * tab cannot be different emails.
 */
export type EmailPreset = EmailData & { id: string; label: string };

export const EMAIL_PRESETS: EmailPreset[] = [
  {
    id: "strain",
    label: "Busy, on an incumbent they dislike",
    firstName: "Dana",
    practice: "Lakeview Women's Health",
    inputs: {
      patientsPerDay: 45,
      noShowRate: 0.14,
      frontDeskStaff: 3,
      collectedRate: 0.5,
      newPatientsPerMonth: 35,
    },
    techStack: ["athenahealth", "Phreesia"],
    intakeSatisfaction: "It frustrates us",
  },
  {
    id: "paper",
    label: "Small, still on paper",
    firstName: "Marcus",
    practice: "Cedar Park OB-GYN",
    inputs: {
      patientsPerDay: 22,
      noShowRate: 0.18,
      frontDeskStaff: 2,
      collectedRate: 0.35,
      newPatientsPerMonth: 14,
    },
    techStack: ["eClinicalWorks", "Paper on a clipboard"],
  },
  {
    id: "healthy",
    label: "Running it well",
    firstName: "Priya",
    practice: "Northside Women's Care",
    inputs: {
      patientsPerDay: 60,
      noShowRate: 0.05,
      frontDeskStaff: 6,
      collectedRate: 0.9,
      newPatientsPerMonth: 60,
    },
    techStack: ["Epic", "Klara"],
    onlineBooking: true,
    asksForReviews: true,
  },
  {
    id: "default",
    label: "The defaults, untouched",
    firstName: "There",
    practice: "Your practice",
    inputs: INPUT_DEFAULTS,
    techStack: ["athenahealth", "Our patient portal"],
  },
];

export function presetById(id: string | null | undefined): EmailPreset {
  return EMAIL_PRESETS.find((p) => p.id === id) ?? EMAIL_PRESETS[0];
}

export type EmailData = {
  firstName: string;
  practice: string;
  inputs: CalcInputs;
  techStack: string[];
  intakeSatisfaction?: string | null;
  onlineBooking?: boolean;
  asksForReviews?: boolean;
};

/** A value that is real in preview and a HubSpot token in the paste version. */
function tok(mode: EmailMode, token: string, real: string): string {
  return mode === "hubspot" ? `{{ contact.${token} }}` : real;
}

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

function bar(value: number, colour: string): string {
  // A nested table, because a div with a percentage width is not reliable in
  // Outlook. The outer cell is the track; the inner is the fill.
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
      <tr>
        <td style="background:${HAIRLINE};border-radius:3px;font-size:0;line-height:0;">
          <table role="presentation" width="${Math.max(2, Math.round(value))}%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="height:6px;background:${colour};border-radius:3px;font-size:0;line-height:0;">&nbsp;</td></tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function dimensionRow(
  label: string,
  value: string,
  detail: string,
  weight: number,
  barPct: number,
  colour: string,
): string {
  return `
  <tr>
    <td style="padding:14px 0;border-bottom:1px solid ${HAIRLINE};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font:600 15px/1.3 ${FONT};color:${INK};">${label}</td>
          <td align="right" style="font:800 17px/1.3 ${FONT};color:${colour};white-space:nowrap;">
            ${value}<span style="font:700 11px/1.3 ${FONT};color:${MUTE};"> / 100</span>
          </td>
        </tr>
      </table>
      ${bar(barPct, colour)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:6px;">
        <tr>
          <td style="font:500 13px/1.4 ${FONT};color:${SUB};">${detail}</td>
          <td align="right" style="font:700 11px/1.4 ${FONT};color:${MUTE};white-space:nowrap;">${weight}% OF SCORE</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function leakRow(label: string, amount: string, formula: string): string {
  return `
  <tr>
    <td style="padding:12px 0;border-bottom:1px solid ${HAIRLINE};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font:600 14px/1.3 ${FONT};color:${INK};">${label}</td>
          <td align="right" style="font:800 15px/1.3 ${FONT};color:${INK};white-space:nowrap;">${amount}</td>
        </tr>
      </table>
      <div style="font:500 12px/1.45 ${FONT};color:${MUTE};margin-top:4px;">${formula}</div>
    </td>
  </tr>`;
}

export function subjectLine(mode: EmailMode, health: ScoreResult): string {
  const gap = biggestGap(health);
  return mode === "hubspot"
    ? "Your practice scored {{ contact.booth_health_score }}. Here's the arithmetic"
    : `Your practice scored ${health.total}. Here's the arithmetic`;
  // gap is deliberately not in the subject: it reads as an accusation before
  // they have seen the number it came from. It leads the body instead.
  void gap;
}

export function preheader(mode: EmailMode, health: ScoreResult, total: number): string {
  return mode === "hubspot"
    ? "{{ contact.booth_health_band }}. Estimated annual leak {{ contact.booth_annual_leak }}, and every assumption behind it."
    : `${health.band.label}. Estimated annual leak ${usdRounded(total)}, and every assumption behind it.`;
}

export function renderEmail(data: EmailData, mode: EmailMode = "preview"): {
  subject: string;
  preheader: string;
  html: string;
} {
  const money = calculate(data.inputs);
  const back = recovery(money);
  const upside = growth(money, data);
  const health = score({
    inputs: data.inputs,
    techStack: data.techStack,
    intakeSatisfaction: data.intakeSatisfaction,
    onlineBooking: data.onlineBooking,
    asksForReviews: data.asksForReviews,
  });
  const gap = biggestGap(health);
  // Straight off the shared palette, so the email and the phone agree.
  const bandColour = TONE[health.band.tone].solid;

  const first = tok(mode, "firstname", data.firstName);
  const practice = tok(mode, "company", data.practice);
  const scoreValue = tok(mode, "booth_health_score", String(health.total));
  const bandLabel = tok(mode, "booth_health_band", health.band.label);
  const gapLabel = tok(mode, "booth_biggest_gap", gap.label);
  const leakTotal = tok(mode, "booth_annual_leak", usdRounded(money.total));
  const recovered = tok(mode, "booth_annual_recovery", usdRounded(back.total));
  const hoursFreed = tok(
    mode,
    "booth_hours_freed",
    Math.round(upside.hoursFreed).toLocaleString("en-US"),
  );

  const byKey = Object.fromEntries(money.components.map((c) => [c.key, c]));
  const leakLines = (["missed", "staff", "admin", "collection", "denials"] as const)
    .map((k) =>
      leakRow(
        byKey[k].label,
        tok(mode, `booth_leak_${k}`, usd(byKey[k].amount)),
        byKey[k].formula,
      ),
    )
    .join("");

  const dimensionLines = health.dimensions
    .map((d) =>
      dimensionRow(
        d.label,
        String(d.value),
        d.detail,
        d.weight,
        d.value,
        TONE[toneFor(d.value)].solid,
      ),
    )
    .join("");

  // In the token version the bars cannot move, because HubSpot has no
  // arithmetic. So the dimension detail comes through as tokens and the bars
  // are dropped rather than shown at a length that is a lie.
  const dimensionBlock =
    mode === "hubspot"
      ? `<tr><td style="padding:14px 16px;background:${CANVAS};border-radius:10px;font:500 13px/1.5 ${FONT};color:${SUB};">
           Your score is made of four measures: patients who show up (30%), load on the front desk (25%),
           how intake gets done (25%) and money collected up front (20%). The one with the most to gain
           for you is <strong style="color:${INK};">${gapLabel}</strong>.
         </td></tr>`
      : dimensionLines;

  /**
   * The hours, and the two gaps. No dollar figure on either.
   *
   * There was one and it was the biggest number in the email, built by
   * converting freed reception hours into clinical capacity. It was also the
   * easiest line in here to argue with, and a large arguable number takes the
   * sourced ones down with it.
   */
  const gapList = upside.opportunities
    .map(
      (o) => `<li style="margin:0 0 6px 0;">${o.label}</li>`,
    )
    .join("");

  const growthBlock = `<div style="border-top:1px solid #cffafe;margin-top:14px;padding-top:14px;">
              <div style="font:700 11px/1 ${FONT};letter-spacing:0.06em;text-transform:uppercase;color:${MUTE};">
                And the time
              </div>
              <div style="font:800 20px/1.25 ${FONT};color:${INK};letter-spacing:-0.02em;padding-top:6px;">
                ${hoursFreed} front desk hours a year
              </div>
              <div style="font:500 13.5px/1.5 ${FONT};color:${SUB};padding-top:8px;">
                What your desk gets back. We have deliberately not turned that into
                a revenue figure: what you do with the hours is your call, not our
                arithmetic.
              </div>
              ${
                mode === "hubspot" || upside.alreadyDoing
                  ? ""
                  : `<div style="font:500 13.5px/1.5 ${FONT};color:${SUB};padding-top:10px;">
                       Two other things worth fixing:
                       <ul style="margin:8px 0 0 0;padding-left:18px;">${gapList}</ul>
                     </div>`
              }
            </div>`;

  const assumptions = [
    ASSUMPTIONS.avgVisitRevenue,
    ASSUMPTIONS.minutesPerIntakeToday,
    ASSUMPTIONS.minutesSaved,
    ASSUMPTIONS.frontDeskHourlyRate,
    ASSUMPTIONS.adminCostPerIntake,
    ASSUMPTIONS.denialRate,
    ASSUMPTIONS.frontEndDenialShare,
    ASSUMPTIONS.costToRework,
    ASSUMPTIONS.patientResponsibility,
    ASSUMPTIONS.writeOffRate,
    RECOVERY.missed,
    RECOVERY.staff,
    RECOVERY.denials,
    RECOVERY.admin,
    RECOVERY.collection,

  ]
    .map(
      (a) => `
      <tr>
        <td style="padding:7px 0;font:500 13px/1.4 ${FONT};color:${SUB};">${a.label}</td>
        <td align="right" style="padding:7px 0;font:700 13px/1.4 ${FONT};color:${INK};white-space:nowrap;">${a.display}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your practice health check</title>
</head>
<body style="margin:0;padding:0;background:${CANVAS};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader(mode, health, money.total)}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CANVAS};">
<tr><td align="center" style="padding:28px 12px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border:1px solid ${HAIRLINE};border-radius:16px;">

  <!-- Header -->
  <tr>
    <td style="padding:26px 28px 0 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font:700 11px/1 ${FONT};letter-spacing:0.08em;text-transform:uppercase;color:${TEAL};">
            Practice health check
          </td>
          <td align="right" style="font:800 15px/1 ${FONT};color:${INK};">yosi</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- The score -->
  <tr>
    <td style="padding:20px 28px 0 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="96" valign="top" style="width:96px;">
            <table role="presentation" width="88" cellpadding="0" cellspacing="0" border="0" style="width:88px;border:4px solid ${bandColour};border-radius:44px;">
              <tr>
                <td align="center" style="padding:16px 0;font:800 30px/1 ${FONT};color:${INK};">
                  ${scoreValue}
                </td>
              </tr>
            </table>
          </td>
          <td valign="top" style="padding-left:16px;">
            <div style="font:800 22px/1.2 ${FONT};color:${INK};letter-spacing:-0.02em;">
              ${practice} scored ${scoreValue}
            </div>
            <div style="font:700 12px/1.3 ${FONT};letter-spacing:0.06em;text-transform:uppercase;color:${bandColour};margin-top:6px;">
              ${bandLabel}
            </div>
            <div style="font:500 14px/1.5 ${FONT};color:${SUB};margin-top:8px;">
              ${first}, you answered four questions at our booth. Here is what they add up to,
              with everything we assumed printed at the bottom.
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Most to gain -->
  <tr>
    <td style="padding:20px 28px 0 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${TEAL_BG};border:1px solid #cffafe;border-radius:12px;">
        <tr>
          <td style="padding:14px 16px;font:500 13.5px/1.5 ${FONT};color:${INK};">
            <strong style="font-weight:700;">Most to gain: ${gapLabel}.</strong>
            Of the four measures, that is where the largest share of your score is still available.
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Dimensions -->
  <tr>
    <td style="padding:22px 28px 0 28px;">
      <div style="font:700 11px/1 ${FONT};letter-spacing:0.06em;text-transform:uppercase;color:${MUTE};padding-bottom:4px;">
        What the score is made of
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${dimensionBlock}
      </table>
    </td>
  </tr>

  <!-- The leak -->
  <tr>
    <td style="padding:26px 28px 0 28px;">
      <div style="font:700 11px/1 ${FONT};letter-spacing:0.06em;text-transform:uppercase;color:${MUTE};">
        Estimated annual leak
      </div>
      <div style="font:800 40px/1 ${FONT};color:${INK};letter-spacing:-0.03em;padding-top:6px;">
        ${leakTotal}
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
        ${leakLines}
      </table>
    </td>
  </tr>

  <!-- The return -->
  <tr>
    <td style="padding:22px 28px 0 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${TEAL_BG};border:1px solid #cffafe;border-radius:14px;">
        <tr>
          <td style="padding:18px 18px;">
            <div style="font:700 11px/1 ${FONT};letter-spacing:0.06em;text-transform:uppercase;color:${MUTE};">
              What you would get back
            </div>
            <div style="font:800 24px/1.2 ${FONT};color:${INK};letter-spacing:-0.025em;padding-top:6px;">
              ${recovered} a year, recovered
            </div>
            <div style="font:500 13.5px/1.5 ${FONT};color:${SUB};padding-top:8px;">
              A share of each figure above, not all of it. The shares are ours rather
              than yours, they are listed at the bottom, and they are the right thing
              to push back on.
            </div>
            ${growthBlock}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td align="center" style="padding:26px 28px 0 28px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="background:${BLUE};border-radius:12px;">
            <a href="${BOOKING_URL}" style="display:inline-block;padding:15px 34px;font:700 15px/1 ${FONT};color:#ffffff;text-decoration:none;">
              Book thirty minutes
            </a>
          </td>
        </tr>
      </table>
      <div style="font:500 12.5px/1.5 ${FONT};color:${MUTE};padding-top:10px;">
        We will bring this screen with your numbers already in it. No discovery call to sit through twice.
      </div>
    </td>
  </tr>

  <!-- Assumptions -->
  <tr>
    <td style="padding:26px 28px 0 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CANVAS};border-radius:12px;">
        <tr>
          <td style="padding:16px 18px;">
            <div style="font:700 11px/1 ${FONT};letter-spacing:0.06em;text-transform:uppercase;color:${MUTE};">
              Everything we assumed
            </div>
            <div style="font:500 12.5px/1.5 ${FONT};color:${SUB};padding:8px 0 4px 0;">
              These are ours, not yours. Tell us what your numbers are and we will rerun it before we speak.
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${assumptions}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:22px 28px 26px 28px;">
      <div style="border-top:1px solid ${HAIRLINE};padding-top:16px;font:500 12px/1.6 ${FONT};color:${MUTE};">
        You answered these questions at the Yosi booth. This is an estimator, not an
        audit. Every practice is different, and what you would actually see depends
        on your payer mix, your schedule and how your front desk runs today.
        <br>
        {{ unsubscribe_link }}
      </div>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  return {
    subject: subjectLine(mode, health),
    preheader: preheader(mode, health, money.total),
    html,
  };
}
