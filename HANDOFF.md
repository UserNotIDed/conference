# Booth demo: state of play

Read this first in a new session. It is the current build, the decisions behind
it, and what is still open. `README.md` has the deeper detail.

    npm run dev              # http://localhost:4000  (pinned)
    open http://localhost:4000/preview   # every screen, one tap, nothing saved

Live for the sales walkthrough: **https://yosi-booth.vercel.app**
It runs with `BOOTH_STANDALONE=1`, so there is no database and nothing is
saved. `HUBSPOT-SETUP.md` is the runbook for turning the posting on.

Port 4000 is pinned in both `package.json` and `.claude/launch.json`
(`autoPort: false`) so the URL never moves.

## What this is

A conference booth demo for USWHA, framed as **"check the health of your
practice"**. The prospect answers about their own practice. There is no patient
roleplay and nothing is simulated. Every answer is a lead field. It ends with a
practice health score, a figure for what Yosi puts back, and a booking CTA.

This repo is standalone; the patient prototype lives separately in the
Health-Passport repo and nothing here depends on it.

## The flow

    QR on the booth → the microsite

| | Screen | Captures |
|---|---|---|
| | Landing | What it is, what it takes, what they get. |
| 1 | About you | Role chips, name, email, practice, address |
| 2 | Your setup | Their stack; EHR and any incumbent derived from it |
| 2b | How it's working out | Satisfaction, what costs them time, online booking and reviews |
| 3 | Your numbers | Six sliders: providers, patients/day, no-show, front desk headcount, collected up front, new patients/month |
| | Practice health score | Ring, band, four weighted dimensions, the scoring |
| | What Yosi puts back | The claim, the leak it comes out of, the working folded away |
| | Book a demo | Their figure in the headline → yosi.health, click recorded |

## Two audiences, two surfaces

| | Booth microsite | Discovery readout |
|---|---|---|
| Who drives | The prospect, alone | A rep, on a call |
| Shape | One screen at a time, portrait | One 16:9 card, landscape |
| Price | Never | Typed by the rep, never stored |
| Shape of output | A screen at a time | Two 16:9 slides |
| Gate | Open, it is meant to be found | Passcode, it is meant not to be |
| Lives at | `/` | `/discovery` |

The readout is the same arithmetic with a human in the room, which is the
only reason it can carry a price at all. It leads with the return multiple
rather than the spend, carries the health ring and the evidence behind each
figure, and ends with what they ticked and what they said. Bento rather than
a column: a readout is not an argument with a beginning and an end, it is a
board somebody scans in the ten seconds before they start talking.

Built to the deck template: a sentence for a headline, their own answers down
the left, components in the middle each naming where its rate came from, and
the value in a dark card on the right. **One deliberate departure.** The
template's pills read "Yosi customer result" and ours cannot: we do not have
customer results, we have MGMA, BLS and NIH-indexed studies. The pills name
the real source instead. Same job on the slide, and it survives being asked
which customers.

`--color-magenta` is deck-only. The product has five working colours and no
decorative one, which is right for a screen somebody fills in and wrong for a
slide somebody scans. It appears on `/discovery` and nowhere a prospect
self-serving can reach. Everything in it is sized in `cqw`,
so the card on screen and the card in a screenshot are the same composition
at any window size. Fixed pixel type would reflow and the layout a rep
rehearsed with would not be the one they present.

## Decisions that are settled. Do not re-litigate without asking

- **There is no patient roleplay, and nothing is simulated.** The PIN, the card
  scan, the eligibility check and the copay screen were all removed: they were a
  patient's experience demonstrated to a buyer, which needed explaining at a
  booth. The patient-side screens are not recoverable from this repo. The
  canonical patient-facing design is the `yosi/` prototype in the
  Health-Passport repo.
- **Four health bands, four colours, one definition.** `TONE` in `score.ts`:
  red under 50, orange to 64, blue to 79, green from 80. Hex rather than
  Tailwind classes because the same four have to drive an SVG gradient, a
  progress bar and an HTML email, and an email cannot see a stylesheet. The
  ring, the dimension bars and the email all read it; they used to each keep
  their own thresholds and had already drifted.
- **The money screen leads with what Yosi puts back, not with the leak.**
  Saying the ratio ourselves is stronger than being caught at it, and the leak
  earns its place as the denominator: without it the recovery figure is an
  unanchored vendor claim.
- **No rate card in this repository. It is public.** Yosi bills per provider
  per month and the sheets we work from are negotiated per group, not list.
  The flow captures provider count, which is what sizes a deal, and puts no
  price anywhere near the screen. If a payback figure is ever wanted, the rate
  belongs in an environment variable on the deployment.
- **No-shows are costed but never claimed from.** They are out of the leak and
  out of the recovery entirely, which took the capture ratio from about a third
  to around 70% and left every remaining line benchmarked. They appear on their
  own card, with the cost, which is pure arithmetic on the prospect's own
  no-show rate, and with no recovery percentage attached. The cost is not
  arguable; a rate would have been. It is the opening for scheduling and
  reminders rather than for intake, and it is usually the biggest number on the
  screen.
- **Score and money do different jobs, on different screens.** The score answers
  "where do I stand", which is what the landing page promised. The money answers
  "so what", which is what books a meeting. On one screen the reader picks
  neither.
- **Every constant is printed on the prospect's phone, tagged Ours or Sourced.**
  A visible assumption gets argued with, and arguing is engagement.
- **Internal notes never render.** `Constant.source` is what the buyer reads;
  `Constant.internal` is for `CRITERIA.md`. "NEEDS MARKETING SIGN-OFF" once made
  it onto the buyer's screen.
- **Nothing is asked that has to be looked up.** Six sliders, no keyboard.
  Minutes per patient on registration is locked at 14 rather than asked, because most
  people guess it badly and slowly, and a slider nobody can answer confidently
  costs more time than the precision buys. It is still printed as an
  assumption, tagged as ours.
- **HubSpot is the database.** `src/lib/hubspot.ts` is the single mapping: the
  property spec, the payload builder and the CSV columns all come from it, so a
  renamed property cannot half-break the integration.
- **The email is sent by HubSpot, not by us.** `/email` renders it two ways:
  real values to argue with, and `{{ contact.booth_* }}` tokens to paste in.
  Any figure the email shows has to exist as a property in `hubspot.ts`.
- **Links always start at screen one.** `?resume=1` opts into resuming.

## Where things live

| File | What |
|---|---|
| `src/lib/flow-content.ts` | Every word, in screen order. Edit copy here. |
| `src/lib/calc.ts` | The leak, the recovery and the no-show upside. Constants and formulas. |
| `src/lib/score.ts` | The practice health score: weights, bands, posture. |
| `scripts/criteria.ts` | Generates `CRITERIA.md` from those two. `npm run criteria`. |
| `scripts/hubspot-setup.ts` | Generates `HUBSPOT-SETUP.md`. `npm run hubspot`. |
| `src/lib/mode.ts` | `BOOTH_STANDALONE`: the flow with no database behind it. |
| `src/lib/tech-stack.ts` | Tool list, competitor set, satisfaction options |
| `src/components/flow/AttendeeFlow.tsx` | Stage machine |
| `src/components/FlowPreview.tsx` | The `/preview` picker |
| `src/lib/hubspot.ts` | Property spec, payload builder, CSV columns. One file. |
| `src/lib/email.ts` | The follow-up email. `/email` previews and copies it. |
| `public/yosi-logo.svg` | The real Yosi logo. Replacing it is a file drop. |
| `prisma/schema.prisma` | One row per phone number |

## Open, needs your call

1. **Booking URL.** `NEXT_PUBLIC_BOOKING_URL`, defaults to `https://yosi.health`.
   Swap in the real scheduler when you have it.
2. **The benchmark report.** The opt-in promises a front desk benchmark built
   from this show's own data. `/admin` computes it live (median patients/day,
   no-show, headcount, patients per FTE). Somebody has to actually send it.
3. **Every placeholder in `CRITERIA.md`.** That sheet is generated from the
   code, lists what each number is, who owns it and what it needs. The four
   patient-collection constants are the last unbenchmarked lines in the leak;
   the score weights and bands are invented outright.
4. **The two HubSpot form GUIDs.** `HUBSPOT_FORM_LEAD` and
   `HUBSPOT_FORM_DIAGNOSIS`. `/admin` shows both as "not set" until they are,
   and the mapping and payloads are already visible there without them.
5. **The domain the QR points at.** Vercel gives you
   `something.vercel.app` free; a CNAME onto `check.yosi.health` (or similar)
   takes ten minutes and is what should be on the printed QR.
4. **Deployment.** Local SQLite works; Vercel needs Turso. See `.env.example`.
   A `file:` URL on Vercel silently loses every session.
5. **Twilio.** Unset means outbound texts are logged, not sent. The inbound
   webhook is `/api/sms`.

## Known rough edges


- Address is five typed fields. A practice-name → address lookup (NPPES) was
  discussed and not built.
- The booking screen is sparse by design; the number and the button are the
  only things on it.
- `/staff` still exists and is not part of the current story.
