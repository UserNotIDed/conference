"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Check, Screen } from "@/components/ui";
import { CapturedCard } from "@/components/Capture";
import { IdIcon, ShieldIcon } from "@/components/icons";
import { BUSINESS_CARD } from "@/lib/prospect-intake";
import { FLOW as F } from "@/lib/flow-content";
import { Alert } from "@/components/Alert";
import { VerifyChip } from "./VerifyChip";
import type { VerifyState } from "./useVerify";
import { fill } from "@/lib/prospect-content";
import type { ClientSession } from "@/lib/session";
import {
  COMMON_TOOLS,
  MORE_TOOLS,
  SATISFACTION,
  TECH_STACK_COPY as T,
} from "@/lib/tech-stack";
import { MultiSelectGrid } from "./MultiSelectGrid";

/** The five form sections named on the landing hub. The PIN and the hub sit
 *  outside the count: one is a gate, the other is a menu. */
export const TOTAL_STEPS = 5;

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function maskPhone(e164: string): string {
  return `(•••) •••-${(e164 || "").slice(-4)}`;
}

/**
 * Step 2 — the one-time code, in two stages.
 *
 * Stage one is the gate itself: this is the phone we have, want the code. Stage
 * two is the code, filled in for them. Two stages rather than one because that
 * is how the real product does it, and because the prospect needs to watch the
 * request happen before the autofill means anything — a code that is simply
 * already there looks like a mockup, whereas one that arrives looks like a
 * product.
 */
export function ScreenVerify({
  session,
  onNext,
}: {
  session: ClientSession;
  onNext: () => void;
}) {
  const code = useMemo(
    () =>
      Array.from(session.token.padEnd(6, "4"))
        .map((ch) => ch.charCodeAt(0) % 10)
        .slice(0, 6)
        .join(""),
    [session.token],
  );
  const [filled, setFilled] = useState(0);
  const done = filled >= 6;

  // Fills on arrival. There is no "send me a code" tap: the code is already in
  // their messages by the time they open the link, and iOS and Android both
  // autofill it — making them ask for it first would be a step the real
  // product does not have.
  useEffect(() => {
    const step = reducedMotion() ? 0 : 110;
    const lead = reducedMotion() ? 0 : 300;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= 6; i++) {
      timers.push(setTimeout(() => setFilled(i), lead + i * step));
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <Screen
      kicker={F.pin.kicker}
      footer={
        <>
          <Button disabled={!done} onClick={onNext}>
            {F.pin.codeCta}
          </Button>
          <p className="mt-2 text-center text-[12px] text-ink-mute">
            {F.pin.codeFootnote}
          </p>
        </>
      }
    >
      <div className="flex flex-col items-center pt-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-bg text-teal">
          <ShieldIcon className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-[26px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink">
          {F.pin.codeTitle}
        </h1>
        <p className="mt-2.5 max-w-[310px] text-[14px] font-medium leading-[1.5] text-ink-sub">
          {fill(F.pin.codeSubtitle, { masked: maskPhone(session.phone) })}
        </p>

        <div
          className="mt-8 flex justify-center gap-2"
          role="status"
          aria-live="polite"
          aria-label={done ? `Code ${code} entered` : "Waiting for the code"}
        >
          {code.split("").map((digit, i) => (
            <span
              key={i}
              className={`flex h-14 w-11 items-center justify-center rounded-[12px] border text-[22px] font-extrabold tabular-nums transition-colors duration-200 ${
                i < filled
                  ? "border-teal bg-white text-ink"
                  : "border-hairline bg-white text-transparent"
              }`}
            >
              {i < filled ? digit : "\u00A0"}
            </span>
          ))}
        </div>

        <div className="mt-5 h-5">
          {done ? (
            <span className="animate-fade-up inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-green">
              <Check className="h-3.5 w-3.5" /> {F.pin.matched}
            </span>
          ) : null}
        </div>

        <div className="mt-6 w-full text-left">
          <Alert>{F.pin.alert}</Alert>
        </div>
      </div>
    </Screen>
  );
}

/**
 * Step 3 — the capture demo.
 *
 * This screen sells; it does not collect. It writes no identity — the details
 * it shows are the ones they typed on the charger screen a moment ago, played
 * back as if a scan had produced them.
 *
 * That is why the capture moved to the front. Showing a stranger's name here
 * was the weakest moment in the flow and it filled the CSV with a fictional
 * person; showing their own name is the strongest, and costs nothing. The
 * footnote says plainly that it is simulated.
 *
 * It is the best thirty seconds in the demo: tap, a beat of "reading…", and a
 * form fills itself. That is the insurance-card moment, and it is the thing an
 * RCM person cannot picture from a description.
 */
export function ScreenBusinessCard({
  session,
  verify,
  onScan,
  onNext,
}: {
  session: ClientSession;
  verify: VerifyState;
  onScan: () => void;
  onNext: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "reading" | "done">("idle");

  useEffect(() => {
    if (phase !== "reading") return;
    const t = setTimeout(() => {
      setPhase("done");
      // The card is read; the payer check starts immediately and runs while
      // they read the result — which is the whole claim being made.
      onScan();
    }, 1500);
    return () => clearTimeout(t);
  }, [phase, onScan]);

  return (
    <Screen
      kicker={F.card.kicker}
      step={2}
      total={5}
      title={F.card.title}
      subtitle={F.card.subtitle}
      footer={
        <>
          <Button disabled={phase !== "done"} onClick={onNext}>
            {F.card.cta}
          </Button>
          <p className="mt-2 text-center text-[12px] text-ink-mute">
            {phase === "done" ? F.card.sampleNote : F.card.footnote}
          </p>
        </>
      }
    >
      {phase === "done" ? (
        <div className="animate-fade-up space-y-4">
          <CapturedCard
            label={F.card.capturedLabel}
            preview={null}
            onRescan={() => setPhase("idle")}
            rows={[
              {
                label: "Name",
                value: session.capture.name || BUSINESS_CARD.name,
              },
              {
                label: "Practice",
                value: session.capture.practice || BUSINESS_CARD.practice,
              },
              {
                label: "Work email",
                value: session.capture.email || BUSINESS_CARD.email,
              },
            ]}
          />
          <VerifyChip verify={verify} />
          <Alert tone={verify.status === "complete" ? "success" : "info"}>
            {verify.status === "complete"
              ? F.card.eligibilityAlert
              : F.card.alert}
          </Alert>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setPhase("reading")}
            disabled={phase === "reading"}
            className="flex w-full flex-col items-center justify-center rounded-[18px] border-2 border-dashed border-teal/30 bg-teal-bg px-6 py-12 transition active:scale-[0.99]"
          >
            <span
              className={`flex h-16 w-16 items-center justify-center rounded-full border border-teal/20 bg-white text-teal ${
                phase === "reading" ? "animate-pulse" : ""
              }`}
            >
              <IdIcon className="h-7 w-7" />
            </span>
            <span className="mt-4 text-[16px] font-bold text-teal">
              {phase === "reading" ? F.card.readingTitle : F.card.scanTitle}
            </span>
            <span className="mt-1 text-[12px] font-medium text-teal/70">
              {phase === "reading" ? "Hold steady" : F.card.scanSubtitle}
            </span>
          </button>
          <Alert>{F.card.alert}</Alert>
        </div>
      )}
    </Screen>
  );
}

/*
 * The "that's the whole thing" timer screen used to live here and has been
 * removed — it was a full screen that said less than one line does. The
 * elapsed time is still measured and now appears on the result screen, where
 * the reader is already looking at a number.
 */

/**
 * Step 4 — what's already in their stack.
 *
 * Replaces the old "what EHR do you run" tap. At this show the answer is
 * athenahealth for nearly everyone, so the EHR alone buys one datapoint that
 * every record shares. The stack is where the signal is — and specifically
 * whether an intake vendor is already in it, which changes the entire
 * conversation from "do you need this" to "what is wrong with the one you have".
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
      step={4}
      total={TOTAL_STEPS}
      title={T.title}
      subtitle={T.subtitle}
      footer={
        <div className="flex items-center gap-3">
          <p className="flex-1 text-[13px] font-medium text-ink-mute">
            {selected.length === 0
              ? T.emptyFooter
              : T.countFooter(selected.length)}
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
 * Step 4b — only for people already paying a competitor.
 *
 * The most valuable answer in the whole demo. Someone on paper is a maybe;
 * someone who tells a stranger at a booth that their intake vendor frustrates
 * them is a pipeline entry with a reason attached. Skipped entirely when there
 * is no incumbent, so it costs nothing for everyone else.
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
      step={4}
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
