"use client";

import { useState } from "react";
import { answeredSession, blankSession } from "@/lib/blank-session";
import { AttendeeFlow, type Stage } from "@/components/flow/AttendeeFlow";

/**
 * Every screen in the flow, reachable in one tap, and fully working.
 *
 * Reviewing the last screen should not cost a ninety-second run through the
 * first four. Pick one here and it renders on its own.
 *
 * It runs the real AttendeeFlow rather than a parallel copy of it, so every
 * button works and you can click forward from wherever you land, which is
 * also the only way to stop the picker drifting out of date. What is switched
 * off is persistence: writes go to a queue that drops them, so nothing reaches
 * the database and no lead is created.
 */

type Group = "ask" | "diagnosis";
type Entry = {
  id: Stage;
  label: string;
  group: Group;
  note: string;
  /** Needs the earlier answers to have something to show. */
  answered?: boolean;
};

const SCREENS: Entry[] = [
  {
    id: "landing",
    label: "Landing",
    group: "ask",
    note: "What it is, what it takes, what they get.",
  },
  {
    id: "contact",
    label: "1 · About you",
    group: "ask",
    note: "Role chips, contact details, optional address.",
  },
  {
    id: "stack",
    label: "2 · Your setup",
    group: "ask",
    note: "Common tools, then search. Feeds a quarter of the score.",
  },
  {
    id: "intakeCheck",
    answered: true,
    label: "2b · How it's working out",
    group: "ask",
    note: "Everyone gets it. The subject is whatever they run.",
  },
  {
    id: "numbers",
    label: "3 · Your numbers",
    group: "ask",
    note: "Five sliders. No keyboard, nothing to look up.",
  },
  {
    id: "score",
    answered: true,
    label: "Practice health score",
    group: "diagnosis",
    note: "Ring, band, four weighted dimensions, the scoring.",
  },
  {
    id: "money",
    answered: true,
    label: "Leak and ROI",
    group: "diagnosis",
    note: "Four leak components, what we recover, what we cost.",
  },
  {
    id: "booking",
    answered: true,
    label: "Book a demo",
    group: "diagnosis",
    note: "Their figure, then out to yosi.health.",
  },
];

export function FlowPreview() {
  const [id, setId] = useState<Stage>("landing");
  // Bumped to remount the flow, so "Restart" replays the screen you are on.
  const [nonce, setNonce] = useState(0);
  const current = SCREENS.find((s) => s.id === id) ?? SCREENS[0];
  const session = current.answered ? answeredSession() : blankSession();

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="border-b border-hairline bg-white px-5 py-5 lg:h-dvh lg:w-[320px] lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-teal">
          Yosi booth
        </p>
        <h1 className="mt-1.5 text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
          Every screen
        </h1>
        <p className="mt-2 text-[12.5px] leading-[1.5] text-ink-sub">
          A prospect checks the health of their own practice. Every button
          works and you can click forward from anywhere; nothing is saved and
          no lead is created. Copy lives in{" "}
          <code className="rounded bg-canvas px-1 py-0.5 text-[11.5px]">
            flow-content.ts
          </code>
          , the money in{" "}
          <code className="rounded bg-canvas px-1 py-0.5 text-[11.5px]">
            calc.ts
          </code>
          , the score in{" "}
          <code className="rounded bg-canvas px-1 py-0.5 text-[11.5px]">
            score.ts
          </code>
          .
        </p>

        {(["ask", "diagnosis"] as Group[]).map((group) => (
          <section key={group} className="mt-5">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-mute">
              {group === "ask" ? "What we ask" : "What they get"}
            </h2>
            <div className="mt-2 space-y-1">
              {SCREENS.filter((s) => s.group === group).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setId(s.id);
                    setNonce((n) => n + 1);
                  }}
                  className={`w-full rounded-[10px] px-3 py-2 text-left transition ${
                    id === s.id ? "bg-teal-bg" : "hover:bg-canvas"
                  }`}
                >
                  <span
                    className={`block text-[13.5px] font-bold ${
                      id === s.id ? "text-teal" : "text-ink"
                    }`}
                  >
                    {s.label}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-[1.4] text-ink-mute">
                    {s.note}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </aside>

      <main className="flex-1 bg-canvas p-5 lg:p-10">
        <div className="mx-auto w-full max-w-[430px]">
          <div className="mb-3 flex items-center justify-center gap-3">
            {/* The entry point, not the current screen. Once you start
                clicking forward the flow moves on and this would otherwise
                read as a stale label for whatever is on the glass. */}
            <p className="text-[12px] font-medium text-ink-mute">
              Started at{" "}
              <span className="font-semibold text-ink-sub">{current.label}</span>
            </p>
            <button
              type="button"
              onClick={() => setNonce((n) => n + 1)}
              className="text-[12px] font-bold text-teal"
            >
              Restart
            </button>
          </div>
          <div className="overflow-hidden rounded-[28px] border border-hairline bg-white shadow-[0_16px_32px_-8px_rgba(15,23,42,0.10)]">
            {/* Remounted on every selection so entrance animations, the code
                autofill and any internal step state replay from the top. */}
            <div key={`${id}-${nonce}`} className="min-h-[760px]">
              <AttendeeFlow session={session} ephemeral startAt={id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
