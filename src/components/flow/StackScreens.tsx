"use client";

import { useState } from "react";
import { Button, CapLabel, Check, Screen } from "@/components/ui";
import { Alert } from "@/components/Alert";
import { FLOW as F, fill } from "@/lib/flow-content";
import type { ClientSession } from "@/lib/session";
import {
  COMMON_TOOLS,
  MORE_TOOLS,
  NO_PAIN,
  PAIN_POINTS,
  SATISFACTION,
  TECH_STACK_COPY as T,
} from "@/lib/tech-stack";
import { MultiSelectGrid } from "./MultiSelectGrid";

/** Three sections: about you, your setup, your numbers. */
export const TOTAL_STEPS = 3;

/**
 * Section 2. What's already in their stack.
 *
 * At this show the EHR answer is athenahealth for nearly everyone, so asking
 * for it alone buys a column where every row is the same. The stack is where
 * the signal is, and specifically whether an intake vendor is already in it,
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
 * Section 2b. How whatever they run today is working out.
 *
 * This used to fire only for the handful of people already paying an intake
 * vendor, which made the most valuable screen in the flow the one almost
 * nobody saw. Everybody has a way of doing intake and everybody has an opinion
 * about it; only the subject changes, so everybody gets asked.
 *
 * Two questions, both one tap. The first moves their score. The second does
 * not, deliberately: no-shows and collections are already dimensions, so
 * counting a complaint about them again would score the same problem twice.
 * What it buys is an opening line for the follow-up that is in their words.
 */
export function ScreenIntakeCheck({
  subject,
  satisfaction: saved,
  painPoints: savedPain,
  onNext,
}: {
  /** Their vendor's name, or what they do instead. */
  subject: string;
  satisfaction: string | null;
  painPoints: string[];
  onNext: (answer: { satisfaction: string | null; painPoints: string[] }) => void;
}) {
  const [satisfaction, setSatisfaction] = useState<string | null>(saved);
  const [pain, setPain] = useState<string[]>(savedPain);

  const togglePain = (option: string) =>
    setPain((prev) => {
      // "Honestly, it works" is the opposite of the others, so it clears them
      // and they clear it. A list that says both is a list nobody can report on.
      if (option === NO_PAIN) return prev.includes(NO_PAIN) ? [] : [NO_PAIN];
      const without = prev.filter((p) => p !== NO_PAIN);
      return without.includes(option)
        ? without.filter((p) => p !== option)
        : [...without, option];
    });

  return (
    <Screen
      kicker={T.competitor.kicker}
      step={2}
      total={TOTAL_STEPS}
      title={fill(T.competitor.title, { tool: subject })}
      subtitle={T.competitor.subtitle}
      footer={
        <>
          <Button onClick={() => onNext({ satisfaction, painPoints: pain })}>
            {T.competitor.cta}
          </Button>
          {/* Never a dead end. Somebody will have no opinion, and a screen
              they cannot get past is worse than a blank field. */}
          <button
            type="button"
            onClick={() => onNext({ satisfaction: null, painPoints: [] })}
            className="mt-1 min-h-[44px] w-full text-[13px] font-bold text-ink-sub"
          >
            {T.competitor.skip}
          </button>
        </>
      }
    >
      <CapLabel>{T.competitor.satisfactionLabel}</CapLabel>
      <div className="mt-2.5 space-y-2">
        {SATISFACTION.map((option) => {
          const on = satisfaction === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setSatisfaction(on ? null : option)}
              aria-pressed={on}
              // No bg-white in the base: two background utilities on one
              // element resolve by CSS source order, not by the order they are
              // written here, and bg-white was winning. White text on a white
              // button is a selected option that looks like an empty box.
              className={`flex w-full items-center gap-3 rounded-[14px] border-2 px-4 py-3.5 text-left text-[15px] font-semibold transition active:scale-[0.99] ${
                on
                  ? "border-blue bg-blue text-white"
                  : "border-hairline bg-white text-ink"
              }`}
            >
              <span
                className={`flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border-2 ${
                  on ? "border-white bg-white/20" : "border-hairline"
                }`}
              >
                {on ? <Check className="h-2.5 w-2.5" /> : null}
              </span>
              {option}
            </button>
          );
        })}
      </div>

      <div className="mt-7">
        <CapLabel>{T.competitor.painLabel}</CapLabel>
        <p className="mt-1 text-[12px] text-ink-mute">{T.competitor.painHint}</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {[...PAIN_POINTS, NO_PAIN].map((option) => {
            const on = pain.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => togglePain(option)}
                aria-pressed={on}
                className={`min-h-[42px] rounded-full border-2 px-4 text-[13.5px] font-semibold transition active:scale-[0.97] ${
                  on
                    ? "border-blue bg-blue text-white"
                    : "border-blue/40 bg-white text-ink"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}
