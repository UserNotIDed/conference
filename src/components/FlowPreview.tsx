"use client";

import { useState } from "react";
import { mockSession } from "@/lib/mock-session";
import { AttendeeFlow, type Stage } from "@/components/flow/AttendeeFlow";

/**
 * Every screen in the flow, reachable in one tap — and fully working.
 *
 * The prospect-facing screens sit at the end of the attendee path, behind six
 * patient screens, which makes reviewing or changing them a two-minute
 * roleplay every time. Pick one here and it renders on its own.
 *
 * It runs the real AttendeeFlow rather than a parallel copy of it, so every
 * button works and you can click forward from wherever you land. What is
 * switched off is persistence: writes go to a queue that drops them, the
 * eligibility check runs on a local clock, and the outbound text is faked.
 * Nothing reaches the database and no lead is created.
 */

type Group = "gate" | "form" | "payoff";
type Entry = { id: Stage; label: string; group: Group; note: string };

const SCREENS: Entry[] = [
  { id: "pin", label: "PIN", group: "gate", note: "Prefilled code. No personalisation yet." },
  { id: "landing", label: "Landing hub", group: "gate", note: "Readiness score and the five sections." },
  { id: "demographics", label: "1 · Demographics", group: "form", note: "Role chips, details, shipping address." },
  { id: "card", label: "2 · Insurance", group: "form", note: "Card scan, then a live eligibility check." },
  { id: "payment", label: "3 · Copay", group: "form", note: "Simulated payment. Matches the eligibility copay." },
  { id: "stack", label: "4 · Tech stack", group: "form", note: "Common tools, then search." },
  { id: "competitor", label: "4b · How's it working out", group: "form", note: "Only if they already pay a rival." },
  { id: "leak", label: "5 · Leak diagnosis", group: "form", note: "Three sliders. The clock stops here." },
  { id: "result", label: "Your annual leak", group: "payoff", note: "Assumptions, benchmark (prechecked), text CTA." },
  { id: "booking", label: "Book a demo", group: "payoff", note: "Their figure, then out to yosi.health." },
];

export function FlowPreview() {
  const [id, setId] = useState<Stage>("pin");
  // Bumped to remount the flow, so "Restart" replays the screen you are on.
  const [nonce, setNonce] = useState(0);
  const session = mockSession();
  const current = SCREENS.find((s) => s.id === id) ?? SCREENS[0];

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
          The prospect goes through intake as themselves. Every button works and
          you can click forward from anywhere; nothing is saved and no lead is
          created. All copy lives in{" "}
          <code className="rounded bg-canvas px-1 py-0.5 text-[11.5px]">
            src/lib/flow-content.ts
          </code>
          .
        </p>

        {(["gate", "form", "payoff"] as Group[]).map((group) => (
          <section key={group} className="mt-5">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-mute">
              {group === "gate"
                ? "Getting in"
                : group === "form"
                  ? "The five sections — on the clock"
                  : "The payoff"}
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
            {/* The entry point, not the current screen — once you start
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
              <AttendeeFlow session={session} preview startAt={id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
