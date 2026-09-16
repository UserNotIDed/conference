# Practice health check: criteria to validate

*Generated from the code by `npm run criteria`. Do not edit by hand. Edit
`src/lib/calc.ts` and `src/lib/score.ts` and regenerate, or this sheet and the
app will disagree.*

Everything marked **⚠️ Ours** is a number we made up so the screens would work.
It is on the attendee's phone, under "What are we assuming?", tagged as ours,
so it is arguable in public, which is the point. It still has to be right.

---

## 1 · The questions we ask

Four sliders, section 3. Nothing else is asked, and nothing is looked up.
Minutes per patient on registration is **not** asked. It is locked at
`14 min` and printed in the assumptions.

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
| **Net revenue per completed visit** | `$145` | ⚠️ **Ours** | Marketing | Carries the largest component of the leak. Marketing to confirm the blended figure before the show. |
| **Loaded front desk hourly cost** | `$26/hr` | Sourced | already sourced | Signed off. |
| **Patient responsibility per visit** | `$32` | ⚠️ **Ours** | RCM | Replace with the average off our own book of customers. |
| **Uncollected balance never recovered** | `40%` | ⚠️ **Ours** | RCM | Invented. Needs a real write-off rate. |
| **Front desk minutes per patient on registration** | `14 min` | ⚠️ **Ours** | already sourced | Locked at 14 by Logan rather than asked for. It drives both the staff component and a quarter of the score, so it is the highest-leverage constant in the model after the recovery rates. |
| **Claims reworked for registration errors** | `5%` | ⚠️ **Ours** | RCM | Needs a citation. Smallest component, so the least urgent of the four. |
| **Cost to rework one claim** | `$25` | Sourced | already sourced | Signed off. |
| **Clinic days per year** | `250` | Sourced | already sourced | Signed off. |
| **Paid hours per front desk FTE** | `2,080` | Sourced | already sourced | Signed off. |

### Recovery rates

The share of each component we claim to recover. **These are the numbers a CFO will attack.** Every one is invented today.

| Constant | Value | Status | Owner | What it needs |
| --- | --- | --- | --- | --- |
| **No-shows recovered** | `35%` | ⚠️ **Ours** | Customer success | The single most aggressive number in the model and the first one a CFO will attack. Needs before/after data from real customers. |
| **Manual entry removed** | `60%` | ⚠️ **Ours** | Customer success | Should be the easiest to evidence, because we can measure it. |
| **Registration rework avoided** | `50%` | ⚠️ **Ours** | Customer success | Needs a customer denial-rate before/after. |
| **Patient balance recovered** | `50%` | ⚠️ **Ours** | Customer success | Needs a customer collection-rate before/after. |

### What we charge

Drives the payback period and the multiple. Modelled as fee plus per-intake so the ROI scales honestly with practice size.

| Constant | Value | Status | Owner | What it needs |
| --- | --- | --- | --- | --- |
| **Platform fee** | `$600/mo` | ⚠️ **Ours** | Sales | Replace with real list price or the mid-market deal band. |
| **Per completed intake** | `$1.10` | ⚠️ **Ours** | Sales | Replace with the real per-transaction price. |


---

## 3 · The practice health score

Four dimensions, each scored 0–100 from an answer they gave, then weighted.
**Every weight and every band below is a placeholder.**

| Dimension | Weight | Measure | 100 at | 0 at |
| --- | --- | --- | --- | --- |
| Patients who show up | 30% | No-show rate | 3% | 20% |
| Load on the front desk | 25% | Registration minutes per person per day | 60 min | 420 min |
| How intake gets done | 25% | What they run today | see below | see below |
| Money collected up front | 20% | Share collected before or at the visit | 95% | 20% |

Between the two ends, straight line. Registration minutes per person per day is
`patients/day × 14 minutes ÷ headcount`.

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

**Practice health score: 51, Under strain**

| Dimension | Score | Weight | Contribution |
| --- | --- | --- | --- |
| Patients who show up | 35 | 30% | 10.5 |
| Load on the front desk | 58 | 25% | 14.5 |
| How intake gets done | 70 | 25% | 17.5 |
| Money collected up front | 40 | 20% | 8.0 |

**Annual leak: $372,608**

| Component | Amount | Formula |
| --- | --- | --- |
| Missed visit revenue | $228,375 | 45/day × 250 days × 14% no-show × $145 |
| Front desk time on manual entry | $68,250 | 14 min × 45/day × 250 days × $26/hr |
| Claim rework from intake errors | $14,063 | 45/day × 250 days × 5% × $25 |
| Patient balances written off | $61,920 | 9,675 visits × $32 × 50% uncollected × 40% |

**Return: $158,873 recovered − $17,843 cost = $141,030 net.**
8.90x on spend, payback in 1.3 months.


---

## 5 · What we need back

1. **The four recovery rates.** Highest priority: they are the entire ROI half
   and none of them is evidenced. No-shows first; it is the largest and the
   least defensible.
2. **Net revenue per completed visit.** Carries the largest single component of
   the leak.
3. **Patient responsibility per visit** and the **write-off rate**.
4. **Price.** Whatever the ROI should be divided by.
5. **The weights and bands in section 3.** Argue with them, because they were set to
   produce sensible-looking scores, which is not the same as being right.

Anything you change, change it in `src/lib/calc.ts` or `src/lib/score.ts` and
run `npm run criteria`. The prospect's screen, the follow-up and this sheet all
read from the same place.
