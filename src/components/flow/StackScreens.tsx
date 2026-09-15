"use client";

import { useState } from "react";
import { Screen } from "@/components/ui";
import { Alert } from "@/components/Alert";
import { FLOW as F, fill } from "@/lib/flow-content";
import type { ClientSession } from "@/lib/session";
import {
  COMMON_TOOLS,
  MORE_TOOLS,
  SATISFACTION,
  TECH_STACK_COPY as T,
} from "@/lib/tech-stack";
import { MultiSelectGrid } from "./MultiSelectGrid";

/** Three sections: about you, your setup, your numbers. */
export const TOTAL_STEPS = 3;

/**
 * Section 2 — what's already in their stack.
 *
 * At this show the EHR answer is athenahealth for nearly everyone, so asking
 * for it alone buys a column where every row is the same. The stack is where
 * the signal is — and specifically whether an intake vendor is already in it,
 * which changes the conversation from "do you need this" to "what is wrong
 * with the one you have".
 *
 * It also feeds a quarter of the health score: how intake actually gets done
 * today is the one dimension we cannot infer from their volumes.
 */
export function ScreenTechStack({
  session,
  onNext,
}: {
  session: ClientSession;
  onNext: (tools: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(session.techStack ?? []);

  return (
    <Screen
      kicker={T.kicker}
      step={2}
      total={TOTAL_STEPS}
      title={T.title}
      subtitle={T.subtitle}
      footer={
        <div className="flex items-center gap-3">
          <p className="flex-1 text-[13px] font-medium text-ink-mute">
            {selected.length === 0 ? T.emptyFooter : T.countFooter(selected.length)}
          </p>
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => onNext(selected)}
            className="min-h-[52px] shrink-0 rounded-[16px] bg-blue px-7 text-[15px] font-bold text-white shadow-[0_4px_8px_0_rgba(11,165,180,0.3)] transition active:scale-[0.985] disabled:opacity-40"
          >
            {T.cta}
          </button>
        </div>
      }
    >
      <div className="mb-5">
        <Alert>{F.stack.alert}</Alert>
      </div>
      <MultiSelectGrid
        common={COMMON_TOOLS.map((t) => t.name)}
        more={MORE_TOOLS.map((t) => t.name)}
        selected={selected}
        onChange={setSelected}
        noneLabel={T.noneLabel}
        addLabel={T.addLabel}
        addPlaceholder={T.addPlaceholder}
        addCta={T.addCta}
        showMoreLabel={T.showMore}
        showLessLabel={T.showLess}
      />
    </Screen>
  );
}

/**
 * Section 2b — only for people already paying a competitor.
 *
 * The most valuable answer in the whole thing. Someone on paper is a maybe;
 * someone who tells a stranger at a booth that their intake vendor frustrates
 * them is a pipeline entry with a reason attached. It also moves their score:
 * a vendor they are unhappy with scores lower than one that works. Skipped
 * entirely when there is no incumbent, so it costs everyone else nothing.
 */
export function ScreenCompetitor({
  tool,
  onNext,
}: {
  tool: string;
  onNext: (satisfaction: string) => void;
}) {
  return (
    <Screen
      kicker={T.competitor.kicker}
      step={2}
      total={TOTAL_STEPS}
      title={fill(T.competitor.title, { tool })}
      subtitle={T.competitor.subtitle}
    >
      <div className="space-y-2.5">
        {SATISFACTION.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onNext(option)}
            className="flex w-full items-center gap-3 rounded-[14px] border border-hairline bg-white px-4 py-4 text-left text-[15px] font-semibold text-ink transition active:scale-[0.99] active:border-teal"
          >
            {option}
          </button>
        ))}
      </div>
    </Screen>
  );
}
