# Practice health check: criteria to validate

*Generated from the code by `npm run criteria`. Do not edit by hand. Edit
`src/lib/calc.ts` and `src/lib/score.ts` and regenerate, or this sheet and the
app will disagree.*

Most of the model now comes from the data team's benchmark workbook (September
2026), which cites MGMA, BLS, HFMA and NIH-indexed studies and deliberately
excludes every competitor. Those constants are marked **Sourced** with their
source key.

Everything still marked **⚠️ Ours** is a number we made up so the screens would
work. It is on the attendee's phone, under "What are we assuming?", tagged as
ours, so it is arguable in public, which is the point. It still has to be right.

## What the workbook does not cover

Three things in the app have no benchmark behind them, and two of them are
load-bearing.

1. **No-shows.** The workbook has no no-show driver at all. It is the largest
   single component of the leak and its 35% recovery rate is ours. Worth asking
   the data team whether they could not source one or decided we should not
   claim it.
2. **Patient collections.** No driver in the workbook either. The whole
   component is ours.
3. **Reviews and online booking.** Ours. The workbook's growth driver is
   capacity, not reach.

## Two things to put back to the data team

- **The hourly rate is unloaded.** $22 is the BLS median wage. Loading it for
  payroll tax and benefits puts it nearer $28 and raises the staff line by
  about a quarter. Which did they intend?
- **The $19.60 per intake almost certainly contains labour**, which is already
  the staff line. We count only the $4.90 before-and-after delta so the two
  cannot double count, but that means we are not using their largest driver at
  full weight. Confirm that is right.
- **The capacity line converts front desk hours into provider appointments.**
  Freed reception time does not create clinical capacity; the constraint on
  seeing more patients is the provider. Their own README calls this a ceiling
  rather than a promise, and the screen says so, but the arithmetic still
  treats one hour of reception time as one hour of appointment slots.

---

## 1 · The questions we ask

Four sliders, section 3. Nothing else is asked, and nothing is looked up.
Minutes per patient on registration is **not** asked. It is locked at
`17 min` and printed in the assumptions.

| Input | Range | Used by |
| --- | --- | --- |
| Patients per day | 5–150 | Leak, score |
| No-show rate | 0–30% | Leak, score |
| Front desk headcount | 1–12 | Leak (cap), score |
| Patient balance collected up front | 0–100% | Leak, score |

Plus, from section 2: what they run today. And from 2b, asked of everyone:
how that is working out, and what actually costs them time. The first pair is
the only input to one quarter of the score. What costs them time is deliberately
**not** scored, because no-shows and collections are already dimensions and
counting a complaint about them again would score the same problem twice.

---

## 2 · The dollar model

### The leak: four components, summed

```
missed     = patients/day × clinic days × no-show rate × net revenue per visit
staff      = minutes each ÷ 60 × patients/day × clinic days × loaded hourly rate
             capped at: headcount × paid hours per FTE × loaded hourly rate
rework     = patients/day × clinic days × rework rate × cost to rework one claim
collection = kept visits × patient responsibility
             × (1 − collected up front) × write-off rate

kept visits = patients/day × clinic days × (1 − no-show rate)
```

The cap on `staff` exists because you cannot save more front desk time than
the front desk is paid for. Without it, a high-volume practice with a small desk
produces a figure a CFO throws out on sight.

### The return

```
recovered = Σ (each leak component × its recovery rate)
cost      = platform fee × 12  +  completed intakes × per-intake price
net       = recovered − cost
multiple  = recovered ÷ cost          (gross, not net; the screen says so)
payback   = cost ÷ (recovered ÷ 12)   months
```

Completed intakes, not booked visits, because a patient who no-shows does not fill in
a form, so we do not bill for one.

### Constants in the leak

What we add to their answers to turn them into money.

| Constant | Value | Status | Owner | What it needs |
| --- | --- | --- | --- | --- |
| **Revenue per completed visit** | `$250` | Sourced | already sourced | Signed off. |
| **Front desk minutes per patient on registration today** | `17 min` | Sourced | already sourced | Signed off. |
| **Of which digital intake removes** | `12 min` | Sourced | already sourced | Signed off. |
| **Ceiling on hours saved per front desk person per week** | `12 hrs` | Sourced | already sourced | Signed off. |
| **Front desk hourly rate** | `$22/hr` | Sourced | already sourced | Signed off. |
| **First-pass claim denial rate** | `8%` | Sourced | already sourced | Signed off. |
| **Denials that start at registration** | `27%` | Sourced | already sourced | Signed off. |
| **Cost to rework one denied claim** | `$25` | Sourced | already sourced | Signed off. |
| **Paper and admin cost per intake that automation removes** | `$4.90` | Sourced | already sourced | Signed off. |
| **Clinic days a year** | `264` | Sourced | already sourced | Signed off. |
| **Patient responsibility per visit** | `$32` | ⚠️ **Ours** | RCM | Ours. The workbook has no patient-collection driver at all, so this whole component is unsourced. |
| **Uncollected balance never recovered** | `40%` | ⚠️ **Ours** | RCM | Ours. Needs a real write-off rate. |

### Recovery rates

The share of each component we claim to recover. **These are the numbers a CFO will attack.** Every one is invented today.

| Constant | Value | Status | Owner | What it needs |
| --- | --- | --- | --- | --- |
| **No-shows recovered** | `35%` | ⚠️ **Ours** | Customer success | Ours, and the single most aggressive number left in the model. The data team's workbook has no no-show driver, which is itself worth asking about: they either could not source one or did not think we should claim it. |
| **Registration time removed** | `71%` | Sourced | already sourced | Signed off. |
| **Registration denials avoided** | `70%` | Sourced | already sourced | Signed off. |
| **Paper and admin cost removed** | `100%` | Sourced | already sourced | Signed off. |
| **Patient balance recovered** | `50%` | ⚠️ **Ours** | Customer success | Ours. The workbook has no collection driver. |

### The growth half

What a new patient is worth, and what share of new patients a better review profile and online booking are worth. The softest numbers in the model.

| Constant | Value | Status | Owner | What it needs |
| --- | --- | --- | --- | --- |
| **Visits from a new patient in year one** | `2.4` | ⚠️ **Ours** | RCM | Ours. Needs a real figure off our own book. |
| **More new patients from a better review profile** | `8%` | ⚠️ **Ours** | Marketing | Ours, and the softest number in the model. It chains through local search ranking, which we neither control nor measure. |
| **More new patients from online booking** | `12%` | ⚠️ **Ours** | Customer success | Ours. Should be measurable from our own booking funnel. |
| **Freed front desk time that becomes new appointments** | `30%` | Sourced | already sourced | Signed off. |
| **Provider time per additional appointment** | `30 min` | Sourced | already sourced | Signed off. |


---

## 3 · The practice health score

Four dimensions, each scored 0–100 from an answer they gave, then weighted.
**Every weight and every band below is a placeholder.**

| Dimension | Weight | Measure | 100 at | 0 at |
| --- | --- | --- | --- | --- |
| Patients who show up | 25% | No-show rate | 3% | 20% |
| Load on the front desk | 20% | Registration minutes per person per day | 60 min | 420 min |
| How intake gets done | 20% | What they run today | see below | see below |
| Money collected up front | 15% | Share collected before or at the visit | 95% | 20% |

Between the two ends, straight line. Registration minutes per person per day is
`patients/day × 17 minutes ÷ headcount`.

### How intake gets done, scored

Base, from what they selected in section 2:

| What they told us | Score |
| --- | --- |
| Digital intake vendor in place | 85 |
| EHR patient portal only | 50 |
| Paper, clipboard or keyed by the desk | 15 |
| Nothing digital in the workflow | 30 |

Then section 2b asks how that is working out, of everyone rather than only of
people with a vendor, and an unhappy answer comes off the base:

| Their answer | Adjustment |
| --- | --- |
| Works well, we would keep it | none |
| It's fine | -5 |
| It frustrates us | -15 |
| We're actively looking to change it | -25 |

Downward only, and this is the part worth arguing about. A tool that frustrates
the people using it is doing less of the job than one that does not, so
dissatisfaction costs points. But a practice that is happy on paper is losing
the same hours either way, so being pleased with it earns nothing. A score that
could be talked upwards by liking your clipboard would deserve everything a CFO
said about it.

### Bands

Four bands, four colours. Four rather than three because three cannot separate
"this is fine" from "this works because people are absorbing it", which is the
distinction the whole conversation turns on, and five means two neighbouring
colours nobody can tell apart on a phone in a bright hall. The same four drive
the ring, the dimension bars and the follow-up email.

| Score | Label | Colour | What we say |
| --- | --- | --- | --- |
| 80–100 | **Healthy** | Green `#16a34a` | Your front desk is not where your revenue is going. |
| 65–79 | **Holding** | Blue `#2563eb` | It works, and it works because people are absorbing the gaps. |
| 50–64 | **Under strain** | Orange `#ea580c` | Volume is outrunning the process at the front of the visit. |
| 0–49 | **At risk** | Red `#dc2626` | Intake is costing you more than it would cost to fix. |

---

## 4 · Worked example

A practice seeing **45 patients a day**, **14% no-show**, **3 on the front desk**,
**50%** of patient balance collected up front,
already running athenahealth and an intake vendor they are unhappy with.

**Practice health score: 41, At risk**

| Dimension | Score | Weight | Contribution |
| --- | --- | --- | --- |
| Patients who show up | 35 | 25% | 8.8 |
| Load on the front desk | 46 | 20% | 9.2 |
| How intake gets done | 70 | 20% | 14.0 |
| Money collected up front | 40 | 15% | 6.0 |
| Getting found and booked | 15 | 20% | 3.0 |

**Annual leak: $600,452**

| Component | Amount | Formula |
| --- | --- | --- |
| Missed visit revenue | $415,800 | 45/day × 264 days × 14% no-show × $250 |
| Front desk time on registration | $63,685 | 17 min × 10,217 visits × $22/hr |
| Paper, printing and scanning | $50,062 | 10,217 visits × $4.90 |
| Patient balances written off | $65,388 | 10,217 visits × $32 × 50% uncollected × 40% |
| Claim rework from registration errors | $5,517 | 10,217 claims × 8% denied × 27% from registration × $25 |

**Recoverable: $273,332.** A share of each component above.
**New-patient upside: $331,200**, for a practice that neither asks
for reviews nor takes bookings online. Different money: the leak is coming
out of something they already do, this never reaches them at all.

Nothing is netted off for what Yosi costs. Price is a conversation to have
with a number in front of you, not a variable buried inside one.


---

## 5 · What we need back

1. **A no-show recovery rate, or a decision not to claim one.** It is the
   largest component of the leak and the only recovery rate still invented.
2. **Patient responsibility per visit** and the **write-off rate**, or a
   decision to drop that component.
3. **Answers to the three questions above** about the hourly rate, the $19.60,
   and the capacity conversion.
4. **The weights and bands in section 3.** Argue with them, because they were
   set to produce sensible-looking scores, which is not the same as being
   right.
5. **The three growth constants.** Visits per new patient, and the review and
   booking uplifts.

Nothing here needs a price. Cost was removed from the model deliberately: a
booth is the wrong place to divide by it.

Anything you change, change it in `src/lib/calc.ts` or `src/lib/score.ts` and
run `npm run criteria`. The prospect's screen, the follow-up and this sheet all
read from the same place.
