"use client";

import { useState } from "react";
import { INPUT_DEFAULTS, type CalcInputs } from "@/lib/calc";
import { model } from "./shared";
import { Ledger } from "./Ledger";
import { Bar } from "./Bar";
import { PerProvider } from "./PerProvider";

/**
 * Three directions for the money screen, same figures, side by side.
 *
 * Built to be argued with rather than approved. Each one is a different answer
 * to the same question, which is what a prospect standing at a booth needs to
 * take away in fifteen seconds, and they trade off against each other rather
 * than one being better.
 */

const DIRECTIONS = [
  {
    id: "current",
    name: "What is live now",
    line: "Headline, two tiles, everything else folded away.",
    good: "Shortest to read. The claim leads and the leak is named in the same breath.",
    bad: "No picture anywhere. Five cards in a stack, and the relationship between the three numbers is stated rather than shown.",
  },
  {
    id: "bar",
    name: "One bar",
    line: "The share we fix, drawn.",
    good: "Answers 'how much of this do you actually fix' before a word is read, and makes 69% look like the strength it is. The no-show bar sits outside the frame at the same scale, so the eye does the disclaimer.",
    bad: "A chart on a sales page invites chart arguments. Needs the bar to be honest at every practice size.",
  },
  {
    id: "ledger",
    name: "Today and after",
    line: "Two columns, line by line, like a P&L.",
    good: "Reads like their accountant made it, not a vendor. Owners and CFOs read a table before a sentence.",
    bad: "Densest of the three, and asks someone holding a phone in a loud room to compare two columns.",
  },
  {
    id: "perprovider",
    name: "Per provider, per month",
    line: "The same money in the unit the practice is sold in.",
    good: "Nobody approves an annual number; they approve a monthly one per provider. When sales later names a price per provider per month, the prospect already has what intake costs them in exactly those terms and does the comparison themselves. We never quote a price or divide by one.",
    bad: "Smaller numbers have less stopping power at a booth. $1,200 a month is easier to shrug at than $142,000 a year.",
  },
] as const;

const PRACTICES: { id: string; label: string; inputs: CalcInputs }[] = [
  {
    id: "mid",
    label: "5 providers, 45/day",
    inputs: {
      providers: 5,
      patientsPerDay: 45,
      noShowRate: 0.14,
      frontDeskStaff: 3,
      collectedRate: 0.5,
      newPatientsPerMonth: 35,
    },
  },
  {
    id: "small",
    label: "2 providers, 20/day",
    inputs: {
      providers: 2,
      patientsPerDay: 20,
      noShowRate: 0.18,
      frontDeskStaff: 2,
      collectedRate: 0.35,
      newPatientsPerMonth: 14,
    },
  },
  {
    id: "big",
    label: "12 providers, 90/day",
    inputs: {
      providers: 12,
      patientsPerDay: 90,
      noShowRate: 0.08,
      frontDeskStaff: 6,
      collectedRate: 0.8,
      newPatientsPerMonth: 60,
    },
  },
  { id: "default", label: "The defaults", inputs: INPUT_DEFAULTS },
];

export function Directions() {
  const [practiceId, setPracticeId] = useState(PRACTICES[0].id);
  const practice = PRACTICES.find((p) => p.id === practiceId) ?? PRACTICES[0];
  const m = model(practice.inputs);

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-hairline bg-white px-6 py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-teal">
          Yosi booth
        </p>
        <h1 className="mt-1.5 text-[24px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
          Three directions for the money screen
        </h1>
        <p className="mt-2 max-w-[760px] text-[13px] leading-[1.55] text-ink-sub">
          Same figures in all four panes, so the only thing being compared is
          the layout. They are not ranked. Pick one, or tell me which half of
          which one you want, and it becomes the real screen.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PRACTICES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPracticeId(p.id)}
              className={`min-h-[38px] rounded-full border-2 px-4 text-[13px] font-semibold transition ${
                practiceId === p.id
                  ? "border-blue bg-blue text-white"
                  : "border-blue/30 bg-white text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex gap-5 overflow-x-auto p-6">
        {DIRECTIONS.map((d) => (
          <section key={d.id} className="w-[400px] shrink-0">
            <h2 className="text-[15px] font-extrabold tracking-[-0.01em] text-ink">
              {d.name}
            </h2>
            <p className="mt-0.5 text-[12.5px] font-medium text-ink-sub">
              {d.line}
            </p>
            <div className="mt-3 overflow-hidden rounded-[24px] border border-hairline bg-white shadow-[0_12px_28px_-10px_rgba(15,23,42,0.12)]">
              <div className="min-h-[560px]">
                {d.id === "bar" ? <Bar m={m} /> : null}
                {d.id === "ledger" ? <Ledger m={m} /> : null}
                {d.id === "perprovider" ? <PerProvider m={m} /> : null}
                {d.id === "current" ? (
                  <div className="flex h-full min-h-[560px] flex-col justify-center px-6 text-center">
                    <p className="text-[13px] leading-[1.6] text-ink-sub">
                      This one is the real screen. Open{" "}
                      <a
                        href="/preview"
                        className="font-bold text-teal underline"
                      >
                        /preview
                      </a>{" "}
                      and pick <strong>What Yosi puts back</strong> to see it
                      with the disclosures working.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <Note tone="good" text={d.good} />
              <Note tone="bad" text={d.bad} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Note({ tone, text }: { tone: "good" | "bad"; text: string }) {
  return (
    <div
      className={`rounded-[12px] border px-3.5 py-2.5 ${
        tone === "good"
          ? "border-green/25 bg-green-bg"
          : "border-amber-line bg-amber-bg"
      }`}
    >
      <p className="text-[12px] leading-[1.5] text-ink">
        <span className="font-bold">
          {tone === "good" ? "Works because " : "Costs you "}
        </span>
        {text}
      </p>
    </div>
  );
}
