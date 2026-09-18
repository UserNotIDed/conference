# HubSpot setup

*Generated from `src/lib/hubspot.ts` by `npm run hubspot`. Do not edit by hand:
the property list below has to match what the microsite actually posts.*

Portal **45713988**. Budget about an hour, most of it step 1.

Nothing here needs a developer. There is no app to install, no OAuth, no API
key. The microsite posts to HubSpot's public Forms API, and the form GUID is
the only credential involved.

## What you are building

1. **30 contact properties** so the answers have somewhere to land.
2. **Two forms.** One fires when they tell us who they are, one when the score
   lands. Two rather than one so the follow-up email cannot go out before there
   is a result in it.
3. **One workflow** that sends the email when the second form is submitted.
4. **One email**, pasted from the microsite.

---

## Step 1 · Create the properties

**Settings → Properties → Create property.** Object type: **Contact**. Put them
all in one group (create it, call it *Booth*) so they are easy to find later.

> **The internal name is the contract.** HubSpot generates one from the label
> and it will not match. On the create screen, expand the label field, click
> the internal name, and type the exact value from the first column. If it does
> not match, the microsite posts into a void and the field stays empty on every
> contact, with no error anywhere.

| Internal name | Label | Field type | Form | Options |
| --- | --- | --- | --- | --- |
| `booth_event` | Booth: event | Single-line text | lead |  |
| `booth_role` | Booth: seat at the practice | Dropdown select | lead | `Billing and denials`<br>`Front desk operations`<br>`Running the practice`<br>`Something else` |
| `booth_role_other` | Booth: seat, free text | Single-line text | lead |  |
| `booth_tech_stack` | Booth: tech stack | Single-line text | diagnosis |  |
| `booth_ehr` | Booth: EHR | Single-line text | diagnosis |  |
| `booth_incumbent` | Booth: intake vendor in place | Single-line text | diagnosis |  |
| `booth_intake_satisfaction` | Booth: how intake is working out | Dropdown select | diagnosis | `Works well, we would keep it`<br>`It's fine`<br>`It frustrates us`<br>`We're actively looking to change it` |
| `booth_pain_points` | Booth: what costs them time | Single-line text | diagnosis |  |
| `booth_providers` | Booth: providers in the practice | Number | diagnosis |  |
| `booth_patients_per_day` | Booth: patients per day | Number | diagnosis |  |
| `booth_no_show_rate` | Booth: no-show rate (%) | Number | diagnosis |  |
| `booth_front_desk_fte` | Booth: front desk headcount | Number | diagnosis |  |
| `booth_collected_up_front` | Booth: patient balance collected up front (%) | Number | diagnosis |  |
| `booth_health_score` | Booth: practice health score | Number | diagnosis |  |
| `booth_health_band` | Booth: practice health band | Dropdown select | diagnosis | `Healthy`<br>`Holding`<br>`Under strain`<br>`At risk` |
| `booth_biggest_gap` | Booth: most to gain | Single-line text | diagnosis |  |
| `booth_annual_leak` | Booth: estimated annual leak ($) | Number | diagnosis |  |
| `booth_noshow_cost` | Booth: annual cost of no-shows ($) | Number | diagnosis |  |
| `booth_leak_staff` | Booth: leak: front desk time ($) | Number | diagnosis |  |
| `booth_leak_denials` | Booth: leak: registration denials ($) | Number | diagnosis |  |
| `booth_leak_admin` | Booth: leak: paper and admin ($) | Number | diagnosis |  |
| `booth_leak_collection` | Booth: leak: balances written off ($) | Number | diagnosis |  |
| `booth_annual_recovery` | Booth: recoverable from the leak ($) | Number | diagnosis |  |
| `booth_back_per_provider_month` | Booth: recoverable per provider per month ($) | Number | diagnosis |  |
| `booth_hours_freed` | Booth: front desk hours freed a year | Number | diagnosis |  |
| `booth_new_patients_per_month` | Booth: new patients a month | Number | diagnosis |  |
| `booth_online_booking` | Booth: patients can book online | Single checkbox | diagnosis |  |
| `booth_asks_for_reviews` | Booth: asks for a review after the visit | Single checkbox | diagnosis |  |
| `booth_benchmark_optin` | Booth: wants the benchmark | Single checkbox | diagnosis |  |
| `booth_booking_clicked` | Booth: opened the scheduler | Single checkbox | diagnosis |  |

For the two checkboxes, HubSpot stores `true`/`false`, which is what we send.

### Already on every portal, nothing to do

These are standard contact properties. They are listed only so you can see what
else arrives on the contact.

| Internal name | Label | Field type | Form | Options |
| --- | --- | --- | --- | --- |
| `email` | Email | Single-line text | lead |  |
| `firstname` | First name | Single-line text | lead |  |
| `lastname` | Last name | Single-line text | lead |  |
| `company` | Company name | Single-line text | lead |  |
| `address` | Street address | Single-line text | lead |  |
| `city` | City | Single-line text | lead |  |
| `state` | State | Single-line text | lead |  |
| `zip` | Postal code | Single-line text | lead |  |

---

## Step 2 · Create the two forms

**Marketing → Forms → Create form → Embedded form → Blank template.**

You will never render either of these. They exist so the Forms API has
something to accept a submission into, and so a submission can trigger a
workflow. A field that is not on the form is **silently dropped**, so every
property has to be added to the form that carries it.

### Form 1: "Booth: lead captured"

Add these fields: `email`, `firstname`, `lastname`, `company`, `address`, `city`, `state`, `zip`, `booth_event`, `booth_role`, `booth_role_other`.

Fires the moment section 1 is answered, so the person is captured even if they
put the phone down and walk off. That is the whole reason it is separate.

### Form 2: "Booth: diagnosis"

Add these fields: `booth_tech_stack`, `booth_ehr`, `booth_incumbent`, `booth_intake_satisfaction`, `booth_pain_points`, `booth_providers`, `booth_patients_per_day`, `booth_no_show_rate`, `booth_front_desk_fte`, `booth_collected_up_front`, `booth_health_score`, `booth_health_band`, `booth_biggest_gap`, `booth_annual_leak`, `booth_noshow_cost`, `booth_leak_staff`, `booth_leak_denials`, `booth_leak_admin`, `booth_leak_collection`, `booth_annual_recovery`, `booth_back_per_provider_month`, `booth_hours_freed`, `booth_new_patients_per_month`, `booth_online_booking`, `booth_asks_for_reviews`, `booth_benchmark_optin`, `booth_booking_clicked`, plus `email`, which every submission needs as the dedupe key.

Fires when the score and the money land. This is the one the email listens to.

### Get the GUIDs

Publish both, then open each and look at the URL:

    https://app.hubspot.com/forms/45713988/editor/<THIS BIT>/edit

That is the form GUID. You need both.

---

## Step 3 · Put the GUIDs into Vercel

**Vercel → yosi-booth → Settings → Environment Variables**, Production:

| Name | Value |
| --- | --- |
| `HUBSPOT_FORM_LEAD` | the GUID from form 1 |
| `HUBSPOT_FORM_DIAGNOSIS` | the GUID from form 2 |
| `HUBSPOT_PORTAL_ID` | `45713988` (optional; this is the default) |
| `BOOTH_STANDALONE` | **delete this variable** |

`BOOTH_STANDALONE` is what makes the current deployment forget everything. It
is there so the sales team can run their own details through the walkthrough
without filling the lead list with rehearsals. Removing it is what turns the
posting on, so do it last, and redeploy afterwards.

Check it landed: open `/admin` on the deployment. It shows both GUIDs, and the
exact payload for any lead.

---

## Step 4 · The workflow that sends the email

**Automation → Workflows → Create → Contact-based → From scratch.**

- **Enrolment trigger:** *Form submission* → **Booth: diagnosis**.
- **Re-enrolment:** on. Someone who runs it twice should get the newer number.
- **Action:** *Send email* → the email from step 5.
- Consider a **delay of 15 minutes**. Arriving while they are still at the
  stand is a nice trick but it competes with the conversation they are having
  with you. Arriving after they walk away is when they read it.

---

## Step 5 · The email

Open **`/email`** on the deployment, switch the render to **HubSpot tokens**,
and press **Copy the HTML**.

Then in HubSpot: **Marketing → Email → Create → Regular → Design tools → drag in
a Rich text module → open the source code view → paste.**

Subject and preheader are on the same screen, already written, with the tokens
in them.

Every value in it is a `{{ contact.booth_* }}` token, so it renders per
contact from the properties in step 1. If a property's internal name does not
match, that token renders blank and the email looks broken, which is the
fastest way to find a typo from step 1. **Send yourself a test before you
switch the workflow on.**

---

## Lists worth building on day one

| List | Filter | Why |
| --- | --- | --- |
| **Actively replacing** | `booth_incumbent_satisfaction` is *We're actively looking to replace it* | They have budget, a vendor and a grievance. Call these first. |
| **Frustrated incumbent** | `booth_incumbent_satisfaction` is *It frustrates us* | Same conversation, longer fuse. |
| **Did not book** | `booth_health_score` is known **and** `booth_booking_clicked` is false | Saw their number, did not take a meeting. This is the retarget list and it is the one that matters. |
| **At risk** | `booth_health_band` is *At risk* | Worst scores, biggest figures, easiest opening line. |
| **Big and bleeding** | `booth_annual_leak` greater than 250000 | Sort by deal size rather than by temperature. |

A note on reporting: HubSpot does not do medians natively. The benchmark
promised by the opt-in (`booth_benchmark_optin`) needs the numbers pulled out
to a sheet, or computed on `/admin` before you turn standalone off.

---

## If something does not arrive

The Forms API answers with a 200 and an empty body on success. It does not
complain about a field it does not recognise, which is deliberate on their side
and unhelpful on ours. So, in order:

1. **Check the internal name.** Nine times in ten it is step 1. `/admin` shows
   the exact key the microsite sends; compare it character for character with
   Settings → Properties.
2. **Check the field is on the form.** A property that exists but is not on the
   form is dropped without comment.
3. **Check the GUID.** `/admin` shows the ones the deployment is using.
4. **Check `BOOTH_STANDALONE` is gone** and the project has been redeployed
   since. This is the most likely cause of "nothing at all is arriving".

## The fallback

If the posting fails at the show and nobody notices until the evening, the
leads are not lost: **`/admin` → Export CSV** writes a file whose columns are
these exact internal names. Import it straight onto the Contact object and
everything lands where it would have.

That only works when standalone is off, because standalone keeps no record at
all. Worth knowing before the doors open.
