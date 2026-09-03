# Booth demo — state of play

Read this first in a new session. It is the current build, the decisions behind
it, and what is still open. `README.md` has the deeper detail.

    npm run dev              # http://localhost:4000  (pinned)
    open http://localhost:4000/preview   # every screen, one tap, nothing saved

Port 4000 is pinned in both `package.json` and `.claude/launch.json`
(`autoPort: false`) so the URL never moves. The other app in this repo (`yosi`,
a Vite build) floats on autoPort and had been stealing 3000.

## What this is

A conference booth demo for USWHA. **The prospect runs an intake as
themselves** — not a patient roleplay. They feel the product by being on the
receiving end of it, and every answer is a lead field. It ends with a dollar
figure for their own practice and a booking CTA.

## The flow

    QR on the booth → they text us → we text back a link → they open it

| | Screen | Captures |
|---|---|---|
| — | PIN | Phone verified. Code autofills on arrival; one Continue tap. |
| — | Landing hub | Readiness ring, five tappable sections, charger promise. |
| 1 | Demographics | Role (chips + free-text Other), name, email, practice, address |
| 2 | Insurance | Card scan → live eligibility check → Aetna Active, $25 copay |
| 3 | Copay | Simulated payment of that same $25. No card charged. |
| 4 | Tech stack | Their stack; EHR derived from it |
| 4b | Incumbent satisfaction | Only shown if they already pay an intake vendor |
| 5 | Leak diagnosis | Patients/day, no-show rate, front desk headcount |
| — | Annual leak | The number. Benchmark opt-in, pre-ticked. |
| — | Book a demo | Their figure in the headline → yosi.health, click recorded |

## Decisions that are settled — do not re-litigate without asking

- **It is "annual leak", never "ROI".** ROI requires price, adoption and a
  recovery rate we cannot defend. Leak is a claim about their current state and
  is true whether or not they buy.
- **There is no patient roleplay.** The old patient screens have been deleted.
- **Demographics comes before the card scan** so the scan can play back their
  real details. An earlier build wrote a canned identity into every record.
- **The card scan writes nothing.** It is a demo of capture, labelled as
  simulated.
- **One capture of identity**, on Demographics, not twice.
- **`COPAY_CENTS` is one constant** shared by the eligibility result and the
  payment screen. They must never disagree.
- **Links always start at screen one.** `?resume=1` opts into resuming.
- **No delivery promise on the charger.**

## Where things live

| File | What |
|---|---|
| `src/lib/flow-content.ts` | Every word, in screen order. Edit copy here. |
| `public/yosi-logo.svg` | The real Yosi logo. Replacing it is a file drop, no code change. |
| `src/lib/calc.ts` | Leak formula and the published assumptions. Numbers to defend. |
| `src/lib/tech-stack.ts` | Tool list, competitor set, satisfaction options |
| `src/lib/demo.ts` | Practice, eligibility result, `COPAY_CENTS`, roles |
| `src/components/flow/AttendeeFlow.tsx` | Stage machine |
| `src/components/FlowPreview.tsx` | The `/preview` picker |
| `prisma/schema.prisma` | One row per phone number |

## Open, needs your call

1. **Booking URL.** `NEXT_PUBLIC_BOOKING_URL`, defaults to `https://yosi.health`.
   Swap in the real scheduler when you have it.
2. **The benchmark report.** The opt-in promises a front desk benchmark built
   from this show's own data. `/admin` computes it live (median patients/day,
   no-show, headcount, patients per FTE). Somebody has to actually send it.
3. **Assumptions in `calc.ts`** — $145 net revenue per visit, $26/hr loaded
   front desk, 7 min manual entry, 5% rework, $25 per rework. Conservative and
   printed on screen. Marketing should sign them off.
4. **Deployment.** Local SQLite works; Vercel needs Turso — see `.env.example`.
   A `file:` URL on Vercel silently loses every session.
5. **Twilio.** Unset means outbound texts are logged, not sent. The inbound
   webhook is `/api/sms`.

## Known rough edges


- Address is five typed fields. A practice-name → address lookup (NPPES) was
  discussed and not built.
- The booking screen is sparse by design; the number and the button are the
  only things on it.
- `/staff` still exists and is not part of the current story.
