"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClientSession } from "@/lib/session";
import { getQueue, type PatchKey } from "@/lib/sync";
import { ScreenLanding } from "./LandingScreen";
import { ScreenContact } from "./ContactScreen";
import { ScreenNumbers } from "./NumbersScreen";
import { ScreenCompetitor, ScreenTechStack } from "./StackScreens";
import { ScreenMoney, ScreenScore, ScreenThanks } from "./DiagnosisScreens";
import { competitorIn } from "@/lib/tech-stack";
import { calculate, clampInputs, type CalcInputs } from "@/lib/calc";

export type Stage =
  | "landing"
  | "contact"
  | "stack"
  | "competitor"
  | "numbers"
  | "score"
  | "money"
  | "booking";

/**
 * The practice health check.
 *
 * Three sections and a two-screen diagnosis. The person holding the phone is
 * the prospect answering about their own practice — there is no patient
 * roleplay and nothing here is simulated, so every answer is a lead field and
 * every screen is either a question or the payoff for having answered it.
 *
 * The one rule that shapes the plumbing: no screen ever waits on the network.
 * Each step hands its payload to the sync queue and advances on the next
 * frame, the queue retries in the background, and the server applies patches
 * idempotently by key. On a good connection that is invisible; on conference
 * wifi it is the difference between 90 seconds and a demo that dies in front
 * of an audience.
 */
export function AttendeeFlow({
  session,
  resume = false,
  preview = false,
  startAt,
}: {
  session: ClientSession;
  /** Pick up where the saved state left off instead of starting at screen one. */
  resume?: boolean;
  /**
   * Runs the real flow against a session that does not exist: writes go to a
   * queue that drops them. Everything else — the components, the stage
   * machine, the arithmetic — is the same code the attendee gets, so the
   * preview cannot drift from the thing it is previewing.
   */
  preview?: boolean;
  /** Jump straight to one screen. Preview only. */
  startAt?: Stage;
}) {
  const queue = useMemo(
    () => getQueue(session.token, !preview),
    [session.token, preview],
  );
  const [stage, setStage] = useState<Stage>(
    () => startAt ?? initialStage(session, resume),
  );
  const [role, setRole] = useState<string | null>(session.role);
  const [techStack, setTechStack] = useState<string[]>(session.techStack ?? []);
  const [competitor, setCompetitor] = useState<string | null>(
    session.competitorTool,
  );
  const [satisfaction, setSatisfaction] = useState<string | null>(
    session.competitorSatisfaction,
  );
  /**
   * What they typed on the contact screen, held locally.
   *
   * The page was server-rendered before any of it existed, so the score and
   * the close both have to read it from here rather than from the session
   * snapshot. Carried as one object because carrying the fields individually
   * is how the email got dropped the first time.
   */
  const [contact, setContact] = useState({
    name: session.capture.name,
    email: session.capture.email,
    practice: session.capture.practice ?? session.practiceName,
  });
  const [calcInputs, setCalcInputs] = useState<CalcInputs | null>(
    // Widened to Record<string, number> coming off the server snapshot, so it
    // goes through the same clamp the calculator uses rather than being cast.
    session.calcInputs ? clampInputs(session.calcInputs) : null,
  );
  const [sync, setSync] = useState({ pending: 0, failing: false });

  // Two CTAs sit in the same place on consecutive screens, so a fast
  // double-tap — a bounced finger, or a laggy screen someone taps twice —
  // lands the second hit on the next screen's button and silently skips it.
  // Ignore anything inside 400ms of the last advance; no human fills in a
  // screen that fast.
  const lastAdvance = useRef(0);

  useEffect(() => queue.subscribe(setSync), [queue]);

  // These are picked in this component, so the copy downstream reads them from
  // here rather than from the server snapshot the page was rendered with.
  const view = useMemo<ClientSession>(
    () => ({
      ...session,
      role,
      techStack,
      competitorTool: competitor,
      competitorSatisfaction: satisfaction,
      capture: { ...session.capture, ...contact },
    }),
    [session, role, contact, techStack, competitor, satisfaction],
  );

  useEffect(() => {
    queue.push("opened", {});
  }, [queue]);

  const advance = useCallback(
    (next: Stage, key?: PatchKey, body?: Record<string, unknown>) => {
      const now = Date.now();
      if (now - lastAdvance.current < 400) return;
      lastAdvance.current = now;
      if (key) queue.push(key, body ?? {});
      setStage(next);
    },
    [queue],
  );

  return (
    <>
      {/* The hub: what this is, what it takes, what they get for finishing. */}
      {stage === "landing" ? (
        <ScreenLanding
          sections={[
            {
              id: "contact",
              icon: "person" as const,
              label: "About you",
              note: "Who you are, and where the charger goes.",
              done: Boolean(view.capture.capturedAt || view.capture.name),
            },
            {
              id: "stack",
              icon: "stack" as const,
              label: "Your setup",
              note: "What you're already running today.",
              done: view.techStack.length > 0,
            },
            {
              id: "numbers",
              icon: "chart" as const,
              label: "Your numbers",
              note: "Four sliders. No keyboard, nothing to look up.",
              done: Boolean(view.calcInputs),
            },
          ]}
          onStart={() => advance("contact")}
          onJump={(id) => advance(id as Stage)}
        />
      ) : null}

      {/* 1 — who they are. Every field is a lead field. */}
      {stage === "contact" ? (
        <ScreenContact
          session={view}
          onSubmit={(body) => {
            setRole((body.role as string) || null);
            setContact({
              name: (body.name as string) || null,
              email: (body.email as string) || null,
              practice: (body.practice as string) || null,
            });
            advance("stack", "capture", body);
          }}
        />
      ) : null}

      {/* 2 — the stack, with the incumbent follow-up when there is one. */}
      {stage === "stack" ? (
        <ScreenTechStack
          session={view}
          onNext={(tools) => {
            setTechStack(tools);
            const rival = competitorIn(tools);
            setCompetitor(rival);
            if (!rival) setSatisfaction(null);
            advance(rival ? "competitor" : "numbers", "stack", { tools });
          }}
        />
      ) : null}

      {stage === "competitor" && competitor ? (
        <ScreenCompetitor
          tool={competitor}
          onNext={(value) => {
            setSatisfaction(value);
            advance("numbers", "competitor", { satisfaction: value });
          }}
        />
      ) : null}

      {/* 3 — the five numbers. */}
      {stage === "numbers" ? (
        <ScreenNumbers
          session={view}
          onSubmit={(inputs) => {
            setCalcInputs(inputs);
            advance("score", "calc", { ...inputs });
          }}
        />
      ) : null}

      {/* The diagnosis: where they stand, then what it costs. */}
      {stage === "score" && calcInputs ? (
        <ScreenScore
          session={view}
          inputs={calcInputs}
          onNext={() => advance("money")}
        />
      ) : null}

      {stage === "money" && calcInputs ? (
        <ScreenMoney
          session={view}
          inputs={calcInputs}
          onBenchmark={(optIn) => queue.push("benchmark", { optIn })}
          onNext={() => advance("booking", "finished", {})}
        />
      ) : null}

      {/* Out to the booking page. */}
      {stage === "booking" ? (
        <ScreenThanks
          session={view}
          leakTotal={calcInputs ? calculate(calcInputs).total : null}
          onBooked={() => queue.push("booked", {})}
        />
      ) : null}

      <SyncBadge pending={sync.pending} failing={sync.failing} />
    </>
  );
}

/**
 * Only shown when a write has actually been stuck for a moment. A permanent
 * connectivity indicator trains people to distrust the demo; silence until
 * something is wrong is the honest version.
 */
function SyncBadge({ pending, failing }: { pending: number; failing: boolean }) {
  // Armed by a timer, but shown only while the queue is still actually stuck —
  // deriving the second half means recovery hides the badge on the next render
  // with no state to unwind.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!failing || pending === 0) return;
    const t = setTimeout(() => setArmed(true), 2500);
    return () => clearTimeout(t);
  }, [failing, pending]);

  if (!armed || !failing || pending === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-50 flex justify-center px-5">
      <span className="rounded-full bg-ink/90 px-3.5 py-2 text-[12px] font-semibold text-white shadow-lg">
        Saving — weak signal, we&apos;ll keep trying
      </span>
    </div>
  );
}

/**
 * Where to start.
 *
 * Always at the beginning, unless the link explicitly asks to resume.
 *
 * Resuming from saved state was the default and it was wrong. The whole run is
 * about ninety seconds, so a reload losing your place costs nothing — but
 * resuming means anyone opening the same link twice lands halfway through,
 * which makes the demo impossible to rehearse, impossible to show twice, and
 * baffling when a second person picks up the phone.
 *
 * ?resume=1 brings the old behaviour back for the one case it suits: someone
 * whose phone locked mid-flow and who wants to pick up where they were.
 */
function initialStage(session: ClientSession, resume: boolean): Stage {
  if (!resume) return "landing";
  if (session.calcInputs) return "score";
  if (session.techStack.length > 0) return "numbers";
  if (session.capture.capturedAt) return "stack";
  return "landing";
}
