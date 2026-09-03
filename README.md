# Yosi booth demo

A conference booth demo for Yosi. An attendee texts a number, gets a link, runs
a patient intake on their own phone in under 90 seconds, sees what the
difference is worth at their practice, and tells us where to send a charger.
A booth monitor mirrors the front desk as they go.

Everything outside this app is faked. There is no EHR and no eligibility
clearinghouse. The practice, the patients and the coverage are synthetic —
phone numbers use the 555-01xx reserved range and no PHI is or has ever been in
this codebase.

## The path through it

| Route | What it is |
|---|---|
| `/` | Booth signage. QR code that opens the attendee's messaging app with the keyword pre-filled, plus the "or text DEMO to…" fallback. |
| `/api/sms` | Twilio inbound webhook. Creates one session per phone number and replies with the link. |
| `/d/[token]` | The attendee flow: role, six intake screens, done + timer, leak calculator, shipping capture. |
| `/r/[token]` | The breakdown behind the texted number. Zero JavaScript — it gets opened on a laptop two weeks later. |
| `/staff` | Booth monitor. Polls every two seconds, newest arrival highlighted. |
| `/admin` | Every session, CSV export, and a way to mint a link by hand when something goes sideways. |

**The flow**

    QR on the booth → they text us → we text back a link → they open it

| | Screen | What it captures |
|---|---|---|
| — | **PIN** | Phone, verified. Prefilled code, tap Continue. No name yet, so nothing is personalised. |
| — | **Landing hub** | Nothing. Readiness score, the five sections, and the charger. |
| 1 | Demographics | Role (chips, with a free-text Other), name, email, practice, shipping address |
| 2 | Insurance | Card scan, then a live eligibility check |
| 3 | Copay | A simulated payment. No card is charged. |
| 4 | Tech stack | Their stack; EHR pulled out of it |
| 4b | How's *[vendor]* working out | Incumbent + satisfaction — only if they already pay one |
| 5 | Leak diagnosis | Patients/day, no-show, front desk headcount |
| — | Your annual leak | Benchmark opt-in, **pre-ticked** |
| — | Book a demo | Their own figure in the headline; out to yosi.health, click recorded |

**The hub is the patient hub.** Readiness ring, "what to do" rows that are
tappable, an amount chip on the copay row. It exists so nobody starts a form
without seeing its shape, and so the prospect meets the screen their patients
meet — which is the thing being sold.

**Each screen carries one product callout** in the tinted alert from the Yosi
system, tying what they are doing to what the patient's version does: the
pre-fill on Demographics, the payer check on Insurance, pre-visit collection on
Copay, the medication list on Tech stack, the screener on Leak diagnosis. No
invented statistics — benefit statements only.

**Insurance is the moment to protect.** The card read takes a beat, then the
eligibility check runs against the payer and comes back Active with a copay in
six to nine seconds. The copay it returns is the copay the next screen charges —
one constant, `COPAY_CENTS`, so the two can never disagree.

**The clock covers the five sections.** It starts when Demographics renders and
stops when the volumes are answered. The elapsed time sits on the result screen
next to the figure, and is hidden above two minutes.

**The close uses their number.** "$271,000 a year, and none of it fixes itself."
The figure is passed in from flow state rather than read off the session,
because the page was server-rendered before the calculator ran.

## Starting over

Resuming is the right behaviour for an attendee whose phone locked mid-flow,
and the wrong behaviour for anyone testing — you open the link and land
wherever the last run stopped. Two ways out, and they are not the same:

| | What it does | Use it when |
|---|---|---|
| `/start` | Creates a **new** session and opens it | A rep's phone is being passed around, or you want a clean run |
| `/d/[token]?restart=1` | Wipes **that** session's progress, keeps the row and the link | You are testing a link you own |

`?restart=1` destroys the lead attached to that token, so it is deliberately
not offered anywhere in the UI — the "Hand it to someone else" link at the end
of the flow points at `/start`, which never destroys anything.

## Seeing and editing the screens

`/preview` lists every screen in the flow, split into **what the prospect
answers as themselves** and **what they do as the patient**, and renders any one
of them on its own.

**It is the real flow, not a gallery of screenshots.** Every button works and
you can click forward from wherever you land — pick "Leak calculator", drag the
sliders, and you get the real number on the real result screen. What is switched
off is persistence: writes go to a queue that drops them, the eligibility check
runs on a local clock instead of the server, and the outbound text is faked.
Nothing reaches the database and no lead is created.

It runs `AttendeeFlow` itself rather than a parallel copy, so the preview cannot
drift from the thing it previews. "Restart" replays the screen you are on from
the top, which is how to see the code autofill or the count-up again.

The reason it exists: the prospect-facing screens sit at the *end* of the
attendee path, behind six patient screens. Without a preview, looking at the
shipping form means running a two-minute roleplay first.

**All the copy lives in two files.**

| File | What is in it |
|---|---|
| `src/lib/prospect-content.ts` | Every word the prospect reads as themselves — role question, timer, calculator, qualifying taps, shipping ask, close. |
| `src/lib/intake-content.ts` | The patient side — canned ID/insurance reads, pre-filled health history, women's health questions, consent text. |

Numbers are deliberately not in there. The calculator's assumptions and
formulas live in `src/lib/calc.ts`, because those are figures to defend rather
than copy to tune.

## What we learn about the prospect

The patient intake is theatre. This is the part that leaves with you:

| Where | What it gets you |
|---|---|
| Role screen | Billing / front desk / owner — every lead tagged, before the clock starts |
| Leak calculator | Patients per day, no-show rate, front desk headcount |
| Qualifying screen | EHR or PM system, and how patients do intake today |
| Capture screen | Name, work email, practice, shipping address, benchmark opt-in |
| Behaviour | Whether they finished, how long it took, whether they took the text |

Two taps of qualification sit between the leak number and the charger, and they
are the difference between a lead and a workable one: the EHR is the
integration gate and the first thing an AE asks, and how intake happens today
says whether this is a rip-and-replace or filling a hole. They are outside the
patient clock, so they cost nothing against the ninety seconds.

Expand any row on `/admin` for the whole prospect on one screen — who they are,
what they run, their numbers, and what they actually did in the demo.

## The intake content

All of it lives in `src/lib/intake-content.ts` — the canned ID and insurance
reads, the pre-filled medications, and the questionnaire. That file is the one
place to edit before the show.

**The women's health questions** are scoped to what an OB-GYN front desk
actually collects before a well-woman or follow-up visit: last period, cycle,
pregnancy and contraception, obstetric history, screening currency, and an open
"anything you want to raise". Single-select auto-advances because the tap is the
commit; multi-select and free text wait for Continue.

There is deliberately **no depression screener**. A PHQ-9 belongs to a different
conversation than the one happening at a booth, and it is not what this practice
type is being sold on. If a clinician wants a different instrument in here,
swapping `WOMENS_HEALTH_QUESTIONS` is the whole change — the screen, the storage
and the CSV columns all derive from that array.

**The consent text is placeholder.** It reads plausibly at arm's length and
every document ends with a line saying so. It has not been near a lawyer and
must be replaced before this pattern goes near a real patient. The interaction
is the real one, though: each consent opens in full and cannot be acknowledged
without being shown.

## The front desk benchmark

The opt-in on the capture screen promises a real thing, and `/admin` shows it
being built: median patients per day, no-show rate, front desk headcount,
**patients per front desk FTE**, and median annual leak — overall and split by
role. Every attendee who runs the calculator adds a row.

Patients per FTE is the line that travels. "You are running 18 patients per
person at the desk; the median across the show was 14" is a sentence someone
repeats to their boss; the two raw numbers on their own are not.

It needs a sample before it means anything — aim for around 40 responses, which
one show should clear. Everything behind it is in the CSV, one row per practice,
including each questionnaire answer in its own column.

## How the leak calculator works

Three inputs an attendee knows without looking anything up — patients per day,
no-show rate, front desk headcount — and three components summed:

```
missed  = patients/day × no-show rate × clinic days × net revenue per visit
staff   = minutes of manual entry × patients/day × clinic days × loaded hourly rate
rework  = patients/day × clinic days × registration-error rate × cost to rework
```

The staff component is capped at what the stated headcount is actually paid
for — you cannot save more front desk time than the front desk has. That cap is
the reason headcount is asked for at all, and the breakdown page says so when
it bites.

**Every assumption is printed on the screen next to the number.** A visible
assumption gets argued with, and arguing is engagement; an invisible one gets
the whole thing dismissed as a sales toy. The two figures that are ours rather
than the attendee's — net revenue per visit and loaded hourly cost — are set
conservatively and labelled as ours.

They live in one place, `src/lib/calc.ts`. **Swap them for the numbers
marketing will stand behind before the show.** The source lines are written to
name the kind of benchmark each figure comes from rather than to assert a
specific published statistic, because a number nobody on the stand can defend
is worse than a rounder one they can.

### Role weighting

The brief asked for the calculator to be weighted by role. It reorders the
components and writes the lead line from the actual figures; it does **not**
change the arithmetic. Two people from the same practice getting two different
totals is the fastest way to earn the label the calculator exists to avoid. If
you do want true coefficient weighting, `ROLE_EMPHASIS` is the one place to add
it.

## Things that were built for the room, not the repo

**The timer starts on the first render of the first intake screen.** Not on
session create, and not on the role tap. The text arriving, the walk back to
the booth and picking a role are all real time, but none of it is a patient
filling in intake, which is what the number claims to measure. `openedAt`,
`roleAt` and `startedAt` are all in the CSV if you want to argue the other way.

**No screen waits on the network.** Every step hands its payload to a keyed,
durable, idempotent write queue and advances on the next frame. The queue
retries with backoff, survives a reload in `localStorage`, flushes on
`sendBeacon` when the tab is hidden, and the server applies patches by key so
delivering one twice is indistinguishable from delivering it once. A badge
appears only once a write has actually been stuck for a couple of seconds.

**Eligibility resolves by wall clock, not by a timer in memory.** A serverless
function cannot hold a 6-second `setTimeout` between the request that starts
the check and the one that reads it. The start time and duration are stored, so
any later read computes the same answer and a reload mid-check picks up where
it left off. If the kickoff request itself fails, the client falls back to a
local timer and the server reconciles — the check is faked either way, and a
demo that stalls on conference wifi is worse than one that resolves without the
round trip.

**Eligibility runs underneath the attendee, not in front of them.** It starts
when the card is photographed and lands while they are signing. Waiting on it
would spend eight of the ninety seconds watching a spinner.

**The patient roster rotates.** Attendees role-play a different synthetic
patient each time so `/staff` reads like a real front desk queue instead of
twenty copies of one row. Maria Alvarez is always first, so a scripted
walkthrough matches the mockup.

**The staff board polls.** Nobody standing at a booth can tell a two-second
poll from a socket, and a poll cannot end up silently disconnected for the back
half of the show. A failed poll keeps the last good board up and says so
quietly rather than going blank behind a rep mid-sentence. It is currently
parked — `/staff` works, but the show plan is to keep the record on our side and
close on booking a demo, so the last attendee screen asks for the meeting rather
than pointing at a monitor.

**Resume comes from the server, not the browser.** Reloading mid-flow returns to
the screen you left, derived from what has actually been saved. Reading a
resume point out of `localStorage` during render is a hydration mismatch, and
deriving it from stored state is better anyway — it survives a cleared cache and
works if someone reopens the link on a different device. If the write queue had
not flushed before the reload it lands one step earlier, which is the safe
direction to be wrong in.

**Consecutive CTAs are debounced by 400ms.** Two screens in a row put their
button in the same place, so a bounced finger or a double-tap on a laggy screen
would otherwise land the second hit on the next screen and skip it.

## Weight

First load on `/d/[token]` is about **155 KB gzipped** — 146 KB of JavaScript,
6 KB of CSS, 3 KB of HTML. Nearly all of the JavaScript is the React and Next
runtime; the app's own code is around 35 KB. There is no chart library, no icon
package, no form library and no signature library — the signature is a canvas
and about eighty lines, and it emits a downsampled SVG path small enough to
ride along in the same JSON patch as the rest of the consent, which is also
what lets `/staff` render the actual mark.

The webfont is one `woff2` with `font-display: swap` and a real system fallback
stack, so a dropped font request costs nothing but the typeface.

## Known limits

- `npm audit` flags a stack-exhaustion advisory in `deepmerge-ts`, reached only
  through the Prisma **CLI's** config loader. It is not in the request path of
  the deployed app.
- Photographed cards never leave the device. What is recorded is the "read" —
  the same handful of fields a front desk would key in — which is canned, not
  OCR'd. There is no OCR in here and no image is uploaded.
- Sessions are keyed by phone number, so one number is one session for the life
  of the database. Texting again returns the same link rather than starting
  over, which is what someone who lost the message wants.
