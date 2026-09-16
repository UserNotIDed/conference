# Yosi conference booth demo

A prospect-facing microsite for trade shows, framed as **"check the health of
your practice"**. An attendee scans a QR code, answers three short sections
about their own practice, and gets a practice health score, an estimated annual
leak, and what fixing it would return. Every answer is a lead field.

There is no patient roleplay and nothing in the flow is simulated.

    npm run dev                          # http://localhost:4000  (pinned)
    open http://localhost:4000/preview   # every screen, one tap, nothing saved
    open http://localhost:4000/email     # the follow-up, real values or HubSpot tokens
    open http://localhost:4000/admin     # the HubSpot field mapping and every lead
    npm run criteria                     # regenerate CRITERIA.md from the code
    npm run hubspot                      # regenerate HUBSPOT-SETUP.md

Live for the sales walkthrough: **https://yosi-booth.vercel.app**, running with
`BOOTH_STANDALONE=1`. No database, nothing saved, no secrets. `HUBSPOT-SETUP.md`
is the runbook for turning the posting on.

Every figure in here is an estimate built from four answers and a set of
assumptions that are printed on the prospect's own screen. `CRITERIA.md` lists
which of them are sourced and which are still ours to defend.

## Routes

| Route | What it is |
|---|---|
| `/d/[token]` | The flow itself |
| `/preview` | Every screen, reachable in one tap. Nothing recorded. |
| `/email` | The follow-up email, two renders, copyable |
| `/admin` | HubSpot field mapping, per-lead payloads, CSV export, benchmark |
| `/start` | Mints a fresh session and opens it |
| `/r/[token]` | The breakdown, as a page with no JavaScript |
| `/booth` | Booth signage, with a sample score and the QR |
| `/staff` | A front desk mirror. Parked; see below. |
| `/api/sms` | Twilio inbound webhook. Superseded by the QR-direct plan. |

## The flow

    QR on the booth → the microsite

| | Screen | Captures |
|---|---|---|
| | Landing | What it is, what it takes, what they get |
| 1 | About you | Role chips, name, work email, practice. Address optional. |
| 2 | Your setup | Their stack. EHR and any incumbent are derived from it. |
| 2b | How it's working out | Satisfaction with whatever they run, plus what costs them time |
| 3 | Your numbers | Four sliders: patients/day, no-show, headcount, collected up front |
| | Practice health score | Ring, band, four weighted dimensions, the scoring |
| | Leak and ROI | Four leak components, what we recover, what we cost |
| | Book a demo | Their own figure in the headline, then out to yosi.health |

Copy lives in `src/lib/flow-content.ts`, in screen order, so it can be rewritten
without opening a component.

## The numbers

### The leak

Four components, summed. Every constant is printed next to the figure it
produced, tagged **Ours** or **Sourced**.

```
missed     = patients/day × clinic days × no-show rate × net revenue per visit
staff      = 14 min ÷ 60 × patients/day × clinic days × loaded hourly rate
             capped at: headcount × paid hours per FTE × loaded hourly rate
rework     = patients/day × clinic days × rework rate × cost to rework a claim
collection = kept visits × patient responsibility
             × (1 − collected up front) × write-off rate
```

The cap on `staff` exists because you cannot save more front desk time than the
front desk is paid for. Without it, a high-volume practice with a small desk
produces a figure a CFO throws out on sight.

### The return

```
recovered = Σ (each leak component × its recovery rate)
cost      = platform fee × 12 + completed intakes × per-intake price
net       = recovered − cost
payback   = cost ÷ (recovered ÷ 12) months
```

Completed intakes rather than booked visits, because a patient who no-shows does
not fill in a form.

### The score

Four dimensions, each scored 0 to 100 from an answer they gave, weighted into
one number: patients who show up (30), load on the front desk (25), how intake
gets done (25), money collected up front (20).

Four bands, four colours, defined once as `TONE` in `src/lib/score.ts` and read
by the ring, the dimension bars and the email:

| Score | Band | Colour |
|---|---|---|
| 80 to 100 | Healthy | green |
| 65 to 79 | Holding | blue |
| 50 to 64 | Under strain | orange |
| 0 to 49 | At risk | red |

The screen names the dimension with the most **headroom**, `(100 − value) ×
weight`. Not the lowest score, which ignores what the dimension is worth, and
not the smallest contribution, which always picks the lightest-weighted one.

### Role

Role reorders the leak components and writes the lead line from the actual
figures. It does **not** change the arithmetic. Two people from the same
practice getting two different totals is the fastest way to earn the label the
calculator exists to avoid. `ROLE_EMPHASIS` is the one place to add true
coefficient weighting if you ever want it.

## HubSpot

`src/lib/hubspot.ts` is one file doing three jobs: the property spec to create,
the payload builder for the Forms API submit, and the CSV columns. All three
come from one place, because the usual failure here is a property renamed on one
side and a key still spelling the old name on the other.

The microsite POSTs server-side to

    https://api.hsforms.com/submissions/v3/integration/submit/{portal}/{guid}

No SDK, no OAuth, no private app token. The endpoint is public by design and the
form GUID is the credential. HubSpot dedupes on email, so one person submitting
twice updates one contact. A submission can start a workflow, which is how the
follow-up email goes out without us sending mail.

Server-side rather than from the browser because ad blockers eat HubSpot's
client script and conference wifi eats third-party requests. A lead capture that
fails at a booth is a lead you never knew you had.

Two forms, not one. `lead` fires when section 1 is answered, so the person is
kept even if they walk off. `diagnosis` fires when the score and the money land,
and is the one the email workflow listens to.

`/admin` opens on that mapping and shows, for any lead, the exact payload, built
by the same function the submit uses. Set `HUBSPOT_FORM_LEAD` and
`HUBSPOT_FORM_DIAGNOSIS`; until then both show as not set and everything else
still works.

## The email

HubSpot sends it, not us. `/email` renders one template two ways: real values to
argue about the copy, and `{{ contact.booth_* }}` tokens to paste into a HubSpot
marketing email. One template rather than two, because a preview that is not the
thing you paste is a preview of nothing.

Every token maps to a property in `hubspot.ts`, so a figure that is not in that
spec cannot appear in the email. In the token render the score bars are dropped
rather than shown at a length HubSpot cannot compute.

Tables for layout, inline styles only, no flex, no grid, no SVG, no web fonts,
600px wide. Outlook and Gmail are not browsers.

## Things built for the room, not the repo

**No screen waits on the network.** Every step hands its payload to a keyed,
durable, idempotent write queue and advances on the next frame. The queue
retries with backoff, survives a reload in `localStorage`, flushes on
`sendBeacon` when the tab is hidden, and the server applies patches by key so
delivering one twice is indistinguishable from delivering it once. A badge
appears only once a write has actually been stuck for a couple of seconds.

**Links always open at screen one.** Resuming was the default and it was wrong.
The whole run is about ninety seconds, so losing your place costs nothing, but
resuming made the demo impossible to rehearse or show twice. `?resume=1` opts
back in, deriving the step from what the server has saved rather than from
`localStorage`, because reading a resume point during render is a hydration
mismatch and server state survives a cleared cache.

**Consecutive CTAs are debounced by 400ms.** Two screens in a row put their
button in the same place, so a bounced finger or a double tap on a laggy screen
would otherwise land the second hit on the next screen and skip it.

**Nothing is asked that has to be looked up.** Four sliders, no keyboard.
Minutes per patient on registration is locked at 14 rather than asked, because
most people guess it badly and slowly.

**`/staff` is parked.** It works and it polls every two seconds, which nobody at
a booth can tell from a socket and which cannot end up silently disconnected for
the back half of the show. It is not part of the current story, where the last
screen asks for the meeting rather than pointing at a monitor. Left in the repo
in case that changes.

## Weight

First load is roughly 155 KB gzipped, nearly all of it the React and Next
runtime. The app's own code is around 35 KB. No chart library, no icon package
and no form library: the ring is two SVG circles, the icons are hand-drawn, and
the sliders are native range inputs.

The webfont is one `woff2` with `font-display: swap` and a real system fallback
stack, so a dropped font request costs nothing but the typeface.

## Known limits

- The Forms API submit itself is not wired yet. `formPayload()` builds the body
  and `/admin` shows it; the POST is waiting on real form GUIDs to test against.
  Until then, removing `BOOTH_STANDALONE` gets you the database, not HubSpot.
- Prisma and SQLite are still in the repo. The HubSpot-only rearchitecture
  removes them, but until it lands, local dev uses a file database and Vercel
  would need Turso. See `.env.example`.
- `npm audit` flags a stack-exhaustion advisory in `deepmerge-ts`, reached only
  through the Prisma CLI's config loader. It is not in the request path of the
  deployed app.
- Sessions are keyed by phone number, so one number is one session for the life
  of the database.
