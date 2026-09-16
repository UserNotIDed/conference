/**
 * Fills the board with plausible traffic so you can rehearse /staff and /admin
 * without six people and six phones.
 *
 * Drives the real HTTP API rather than writing to the database, so anything it
 * produces is something the app could have produced. Run against a booth you do
 * not mind polluting:
 *
 *   node scripts/seed-demo.mjs                       # localhost:3000, 5 sessions
 *   node scripts/seed-demo.mjs https://…  8          # somewhere else, 8 sessions
 */

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const count = Number(process.argv[3] ?? 5);

const ROLES = ["billing", "frontdesk", "owner"];
const KEYWORDS = ["DEMO", "RCM", "DESK"];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const between = (lo, hi) => lo + Math.random() * (hi - lo);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function patch(token, patches) {
  const res = await fetch(`${base}/api/session/${token}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patches }),
  });
  if (!res.ok) throw new Error(`PATCH ${token} → ${res.status}`);
  return res.json();
}

async function seedOne(i) {
  // 555-01xx is the reserved range; nothing here can reach a real handset.
  const phone = `+1214555${String(100 + i).padStart(4, "0")}`;
  const form = new URLSearchParams({ From: phone, Body: pick(KEYWORDS) });
  const smsRes = await fetch(`${base}/api/sms`, { method: "POST", body: form });
  const token = (await smsRes.text()).match(/\/d\/([a-z0-9]+)/)?.[1];
  if (!token) throw new Error("no token in the SMS reply");

  const startedAt = Date.now();
  await patch(token, [
    { key: "opened", body: {} },
    { key: "role", body: { role: pick(ROLES) } },
    { key: "started", body: { clientMs: startedAt } },
    { key: "otp", body: {} },
    { key: "identity", body: { legalName: "", dob: "" } },
    {
      key: "identification",
      body: {
        captured: true,
        type: "Driver's license",
        number: "TX-D447091523",
        expires: "10/14/2028",
      },
    },
    {
      key: "insurance",
      body: {
        captured: true,
        provider: "Aetna",
        memberId: "W2740119863",
        planType: "Choice POS II PPO",
        groupNumber: "0847221",
      },
    },
    {
      key: "health",
      body: {
        medications: ["Levothyroxine · 75 mcg · Daily", "Prenatal vitamin · Daily"],
        conditions: pick([["Hypothyroidism"], ["Endometriosis"], []]),
        allergies: pick([["Penicillin, rash"], ["No known allergies"]]),
        confirmed: true,
      },
    },
  ]);

  // Let the eligibility clock actually run, so the board shows a check in
  // flight before it shows a green one.
  await sleep(between(2000, 5000));

  const elapsedMs = Math.round(between(44000, 86000));
  await patch(token, [
    {
      key: "questionnaire",
      body: {
        answers: {
          lmp: pick(["Within the last week", "1–2 weeks ago", "3–4 weeks ago"]),
          cycle: pick(["Regular, no change", "Irregular", "Heavier than usual"]),
          pregnancy: pick(["No", "Not sure", "Currently pregnant"]),
          contraception: pick(["None", "Oral contraceptive", "IUD"]),
          obstetric: pick(["No", "Yes, one", "Yes, two or more"]),
          screening: pick([
            ["All up to date"],
            ["Pap / cervical screening, over 3 years"],
            ["Mammogram, over 1 year", "STI screening, over 1 year"],
          ]),
          concerns: pick(["", "", "Question about switching birth control."]),
        },
      },
    },
    {
      key: "consent",
      body: {
        signedAt: new Date().toISOString(),
        reviewed: ["hipaa", "treat", "financial", "authorization"],
        strokeCount: 1,
        path: "M20 120 C60 40, 110 40, 140 100 S220 150, 300 60",
      },
    },
    { key: "finished", body: { elapsedMs } },
    {
      key: "calc",
      body: {
        patientsPerDay: Math.round(between(18, 90) / 5) * 5,
        noShowRate: Math.round(between(6, 22)) / 100,
        frontDeskStaff: Math.round(between(1, 6)),
      },
    },
  ]);

  // Roughly two in three leave an address; the rest wander off after the number.
  if (Math.random() < 0.66) {
    await patch(token, [
      {
        key: "capture",
        body: {
          email: `contact${i}@example.com`,
          practice: pick([
            "Cedar Park OB-GYN",
            "Riverbend Women's Care",
            "Northgate Family Health",
          ]),
          address: `${100 + i} Main St, Dallas, TX 75201`,
          optIn: Math.random() < 0.5,
        },
      },
    ]);
  }

  console.log(`seeded ${token}: ${(elapsedMs / 1000).toFixed(0)}s intake`);
}

for (let i = 0; i < count; i++) {
  await seedOne(i);
  await sleep(600);
}
console.log(`\ndone, open ${base}/staff`);
