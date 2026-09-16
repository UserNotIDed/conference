/**
 * Generates HUBSPOT-SETUP.md, the runbook for whoever configures the portal.
 *
 * Generated rather than written by hand for the same reason CRITERIA.md is:
 * the property list in it has to be the property list the app posts, and a
 * runbook that drifts sends someone to create a field the code will never
 * fill. Change src/lib/hubspot.ts, run `npm run hubspot`, and it is true again.
 */

import { writeFileSync } from "node:fs";
import { PORTAL_ID, PROPERTIES } from "../src/lib/hubspot";

const TYPE_UI: Record<string, string> = {
  string: "Single-line text",
  number: "Number",
  enumeration: "Dropdown select",
  bool: "Single checkbox",
  datetime: "Date picker",
};

const mine = PROPERTIES.filter((p) => !p.standard);
const standard = PROPERTIES.filter((p) => p.standard);

function table(rows: typeof PROPERTIES): string {
  return [
    "| Internal name | Label | Field type | Form | Options |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map((p) =>
      `| \`${p.name}\` | ${p.label} | ${TYPE_UI[p.type] ?? p.type} | ${p.form} | ${
        p.options ? p.options.map((o) => `\`${o}\``).join("<br>") : ""
      } |`,
    ),
  ].join("\n");
}

const doc = `# HubSpot setup

*Generated from \`src/lib/hubspot.ts\` by \`npm run hubspot\`. Do not edit by hand:
the property list below has to match what the microsite actually posts.*

Portal **${PORTAL_ID}**. Budget about an hour, most of it step 1.

Nothing here needs a developer. There is no app to install, no OAuth, no API
key. The microsite posts to HubSpot's public Forms API, and the form GUID is
the only credential involved.

## What you are building

1. **${mine.length} contact properties** so the answers have somewhere to land.
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

${table(mine)}

For the two checkboxes, HubSpot stores \`true\`/\`false\`, which is what we send.

### Already on every portal, nothing to do

These are standard contact properties. They are listed only so you can see what
else arrives on the contact.

${table(standard)}

---

## Step 2 · Create the two forms

**Marketing → Forms → Create form → Embedded form → Blank template.**

You will never render either of these. They exist so the Forms API has
something to accept a submission into, and so a submission can trigger a
workflow. A field that is not on the form is **silently dropped**, so every
property has to be added to the form that carries it.

### Form 1: "Booth: lead captured"

Add these fields: ${PROPERTIES.filter((p) => p.form === "lead")
  .map((p) => `\`${p.name}\``)
  .join(", ")}.

Fires the moment section 1 is answered, so the person is captured even if they
put the phone down and walk off. That is the whole reason it is separate.

### Form 2: "Booth: diagnosis"

Add these fields: ${PROPERTIES.filter((p) => p.form === "diagnosis")
  .map((p) => `\`${p.name}\``)
  .join(", ")}, plus \`email\`, which every submission needs as the dedupe key.

Fires when the score and the money land. This is the one the email listens to.

### Get the GUIDs

Publish both, then open each and look at the URL:

    https://app.hubspot.com/forms/${PORTAL_ID}/editor/<THIS BIT>/edit

That is the form GUID. You need both.

---

## Step 3 · Put the GUIDs into Vercel

**Vercel → yosi-booth → Settings → Environment Variables**, Production:

| Name | Value |
| --- | --- |
| \`HUBSPOT_FORM_LEAD\` | the GUID from form 1 |
| \`HUBSPOT_FORM_DIAGNOSIS\` | the GUID from form 2 |
| \`HUBSPOT_PORTAL_ID\` | \`${PORTAL_ID}\` (optional; this is the default) |
| \`BOOTH_STANDALONE\` | **delete this variable** |

\`BOOTH_STANDALONE\` is what makes the current deployment forget everything. It
is there so the sales team can run their own details through the walkthrough
without filling the lead list with rehearsals. Removing it is what turns the
posting on, so do it last, and redeploy afterwards.

Check it landed: open \`/admin\` on the deployment. It shows both GUIDs, and the
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

Open **\`/email\`** on the deployment, switch the render to **HubSpot tokens**,
and press **Copy the HTML**.

Then in HubSpot: **Marketing → Email → Create → Regular → Design tools → drag in
a Rich text module → open the source code view → paste.**

Subject and preheader are on the same screen, already written, with the tokens
in them.

Every value in it is a \`{{ contact.booth_* }}\` token, so it renders per
contact from the properties in step 1. If a property's internal name does not
match, that token renders blank and the email looks broken, which is the
fastest way to find a typo from step 1. **Send yourself a test before you
switch the workflow on.**

---

## Lists worth building on day one

| List | Filter | Why |
| --- | --- | --- |
| **Actively replacing** | \`booth_incumbent_satisfaction\` is *We're actively looking to replace it* | They have budget, a vendor and a grievance. Call these first. |
| **Frustrated incumbent** | \`booth_incumbent_satisfaction\` is *It frustrates us* | Same conversation, longer fuse. |
| **Did not book** | \`booth_health_score\` is known **and** \`booth_booking_clicked\` is false | Saw their number, did not take a meeting. This is the retarget list and it is the one that matters. |
| **At risk** | \`booth_health_band\` is *At risk* | Worst scores, biggest figures, easiest opening line. |
| **Big and bleeding** | \`booth_annual_leak\` greater than 250000 | Sort by deal size rather than by temperature. |

A note on reporting: HubSpot does not do medians natively. The benchmark
promised by the opt-in (\`booth_benchmark_optin\`) needs the numbers pulled out
to a sheet, or computed on \`/admin\` before you turn standalone off.

---

## If something does not arrive

The Forms API answers with a 200 and an empty body on success. It does not
complain about a field it does not recognise, which is deliberate on their side
and unhelpful on ours. So, in order:

1. **Check the internal name.** Nine times in ten it is step 1. \`/admin\` shows
   the exact key the microsite sends; compare it character for character with
   Settings → Properties.
2. **Check the field is on the form.** A property that exists but is not on the
   form is dropped without comment.
3. **Check the GUID.** \`/admin\` shows the ones the deployment is using.
4. **Check \`BOOTH_STANDALONE\` is gone** and the project has been redeployed
   since. This is the most likely cause of "nothing at all is arriving".

## The fallback

If the posting fails at the show and nobody notices until the evening, the
leads are not lost: **\`/admin\` → Export CSV** writes a file whose columns are
these exact internal names. Import it straight onto the Contact object and
everything lands where it would have.

That only works when standalone is off, because standalone keeps no record at
all. Worth knowing before the doors open.
`;

writeFileSync(new URL("../HUBSPOT-SETUP.md", import.meta.url), doc);
console.log("Wrote HUBSPOT-SETUP.md");
