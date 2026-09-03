"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClientSession } from "@/lib/session";
import { getQueue, type PatchKey } from "@/lib/sync";
import { ScreenLanding } from "./LandingScreen";
import { ScreenPayment } from "./PaymentScreen";
import { useVerify } from "./useVerify";
import {
  ScreenBusinessCard,
  ScreenCompetitor,
  ScreenTechStack,
  ScreenVerify,
} from "./ProspectScreens";
import {
  ScreenCalc,
  ScreenCalcResult,
  ScreenCapture,
  ScreenThanks,
} from "./PayoffScreens";
import { competitorIn } from "@/lib/tech-stack";
import { COPAY_CENTS } from "@/lib/demo";
import { calculate } from "@/lib/calc";

export type Stage =
  | "pin"
  | "landing"
  | "demographics"
  | "card"
  | "payment"
  | "stack"
  | "competitor"
  | "leak"
  | "result"
  | "booking";

/** The four form sections named on the landing page — the ones on the clock. */
const INTAKE_STAGES: Stage[] = [
  "demographics",
  "card",
  "payment",
  "stack",
  "competitor",
  "leak",
];



/**
 * The attendee flow.
 *
 * The one rule that shapes everything here: no screen ever waits on the
 * network. Each step hands its payload to the sync queue and advances on the
 * next frame, the queue retries in the background, and the server applies
 * patches idempotently by key. On a good connection that is invisible; on
 * conference wifi it is the difference between 60 seconds and a demo that
 * dies in front of an audience.
 *
 * A reload — or a phone that locked and dropped the tab — comes back to the
 * screen it left, resumed from what the server has stored rather than from
 * anything in this browser. See initialStage at the bottom.
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
   * queue that drops them, the eligibility check runs on a local clock, and
   * the outbound text is faked. Everything else — the components, the stage
   * machine, the timings — is the same code the attendee gets, so the preview
   * cannot drift from the thing it is previewing.
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
  /**
   * What the card scan read, held locally.
   *
   * The page was server-rendered before any of it existed, so the shipping
   * screen and the close both have to read it from here rather than from the
   * session snapshot — otherwise the fields they were promised would arrive
   * pre-filled show up empty. Carried as one object because carrying the
   * fields individually is how the email got dropped the first time.
   */
  const { verify, startVerify } = useVerify(session.token, session.verify, preview);
  const [techStack, setTechStack] = useState<string[]>(session.techStack ?? []);
  const [competitor, setCompetitor] = useState<string | null>(
    session.competitorTool,
  );
  const [card, setCard] = useState({
    name: session.capture.name,
    email: session.capture.email,
    practice: session.capture.practice ?? session.practiceName,
  });
  const [elapsedMs, setElapsed] = useState(session.elapsedMs ?? 0);
  const [calcInputs, setCalcInputs] = useState(() =>
    session.calcInputs
      ? {
          patientsPerDay: session.calcInputs.patientsPerDay,
          noShowRate: session.calcInputs.noShowRate,
          frontDeskStaff: session.calcInputs.frontDeskStaff,
        }
      : null,
  );
  const [textState, setTextState] = useState<"idle" | "sending" | "sent">("idle");
  const [sync, setSync] = useState({ pending: 0, failing: false });

  const startRef = useRef<number | null>(session.startedAtMs ?? null);
  // Two CTAs sit in the same place on consecutive screens, so a fast double-tap
  // — a bounced finger, or a laggy screen someone taps twice — lands the second
  // hit on the next screen's button and silently skips it. Ignore anything
  // inside 400ms of the last advance; no human fills in a screen that fast.
  const lastAdvance = useRef(0);
  // Set on the first intake render rather than at construction: reading the
  // clock during render is impure, and the value is meaningless until the
  // first screen is actually on the glass.
  const stepStart = useRef<number>(0);
  const timings = useRef<Record<string, number>>({});


  useEffect(() => queue.subscribe(setSync), [queue]);

  // Role is picked in this component, so the copy downstream reads it from
  // here rather than from the server snapshot the page was rendered with.
  const view = useMemo<ClientSession>(
    () => ({
      ...session,
      role,
      techStack,
      competitorTool: competitor,
      capture: { ...session.capture, ...card },
    }),
    [session, role, card, techStack, competitor],
  );

  useEffect(() => {
    queue.push("opened", {});
  }, [queue]);

  /**
   * The clock starts on the first render of the one-time-code screen — the
   * first thing the patient actually touches. Not on session create, and not on
   * the role tap: the SMS round trip, the walk back to the booth and picking a
   * role are all real time, but none of it is the patient doing intake, and
   * that is what the number on the done screen claims to measure. The code
   * screen is inside the clock precisely because it is part of the product.
   */
  useEffect(() => {
    if (stage !== "demographics" || startRef.current !== null) return;
    const now = Date.now();
    startRef.current = now;
    stepStart.current = now;
    queue.push("started", { clientMs: now });
  }, [stage, queue]);

  const advance = useCallback(
    (next: Stage, key?: PatchKey, body?: Record<string, unknown>) => {
      const now = Date.now();
      if (now - lastAdvance.current < 400) return;
      lastAdvance.current = now;
      if (INTAKE_STAGES.includes(stage) && stepStart.current > 0) {
        timings.current[stage] = now - stepStart.current;
      }
      stepStart.current = now;
      if (key) queue.push(key, body ?? {});
      setStage(next);
    },
    [queue, stage],
  );

  /**
   * Ends the timed part of the run.
   *
   * The clock stops when the last thing we ask for is answered — the volumes —
   * because that is the point at which the prospect has finished doing intake.
   * Everything after it (their number, the charger, booking) is the payoff, and
   * putting it inside the measurement would be dishonest about what took 47
   * seconds.
   */
  const finish = useCallback(
    (inputs: Record<string, unknown>) => {
      const now = Date.now();
      if (now - lastAdvance.current < 400) return;
      lastAdvance.current = now;
      if (stepStart.current > 0) timings.current.leak = now - stepStart.current;
      const total = startRef.current ? now - startRef.current : 0;
      setElapsed(total);
      queue.push("calc", inputs);
      queue.push("finished", { elapsedMs: total, stepTimings: timings.current });
      setStage("result");
    },
    [queue],
  );

  const textResult = useCallback(async () => {
    setTextState("sending");
    if (preview) {
      setTimeout(() => setTextState("sent"), 600);
      return;
    }
    try {
      const res = await fetch(`/api/session/${session.token}/text-result`, {
        method: "POST",
      });
      setTextState(res.ok ? "sent" : "idle");
    } catch {
      // The estimate is already saved and the breakdown page is live; a failed
      // text is a retry, not a dead end.
      setTextState("idle");
    }
  }, [session.token, preview]);

  return (
    <>
      {/* 1. The PIN. Nothing shows until the phone that owns the link is
             proved — same gate the patient gets, and the reason the link is
             safe to text. */}
      {stage === "pin" ? (
        <ScreenVerify session={view} onNext={() => advance("landing", "otp", {})} />
      ) : null}

      {/* 2. The menu: what is in here, and why finishing is worth it. */}
      {stage === "landing" ? (
        <ScreenLanding
          sections={[
            {
              id: "demographics",
              icon: "person" as const,
              label: "Demographics",
              note: "Who you are, and where the charger goes.",
              done: Boolean(view.capture.capturedAt || view.capture.name),
            },
            {
              id: "card",
              icon: "card" as const,
              label: "Insurance",
              note: "Card scan and a live eligibility check.",
              done: Boolean(view.cardAt),
            },
            {
              id: "payment",
              icon: "wallet" as const,
              label: "Copay",
              note: "Collected before the visit, not at the desk.",
              done: Boolean(view.paidAt),
              action: `$${(COPAY_CENTS / 100).toFixed(0)}`,
            },
            {
              id: "stack",
              icon: "stack" as const,
              label: "Tech stack",
              note: "What you're already running.",
              done: view.techStack.length > 0,
            },
            {
              id: "leak",
              icon: "chart" as const,
              label: "Leak diagnosis",
              note: "Three numbers in, your annual leak out.",
              done: Boolean(view.calcInputs),
            },
          ]}
          onStart={() => advance("demographics")}
          onJump={(id) => advance(id as Stage)}
        />
      ) : null}

      {/* 3. Demographics. Also where the charger is going. */}
      {stage === "demographics" ? (
        <ScreenCapture
          session={view}
          onSubmit={(body) => {
            setRole((body.role as string) || null);
            setCard({
              name: (body.name as string) || null,
              email: (body.email as string) || null,
              practice: (body.practice as string) || null,
            });
            advance("card", "capture", body);
          }}
        />
      ) : null}

      {/* 4. Card scan. */}
      {stage === "card" ? (
        <ScreenBusinessCard
          session={view}
          verify={verify}
          onScan={() => void startVerify()}
          onNext={() => advance("payment", "card", {})}
        />
      ) : null}

      {stage === "payment" ? (
        <ScreenPayment
          amountCents={COPAY_CENTS}
          onNext={(paid) =>
            advance("stack", "payment", { paid, amountCents: COPAY_CENTS })
          }
        />
      ) : null}

      {/* 5. Tech stack, with the incumbent follow-up when there is one. */}
      {stage === "stack" ? (
        <ScreenTechStack
          session={view}
          onNext={(tools) => {
            setTechStack(tools);
            const rival = competitorIn(tools);
            setCompetitor(rival);
            advance(rival ? "competitor" : "leak", "stack", { tools });
          }}
        />
      ) : null}

      {stage === "competitor" && competitor ? (
        <ScreenCompetitor
          tool={competitor}
          onNext={(satisfaction) =>
            advance("leak", "competitor", { satisfaction })
          }
        />
      ) : null}

      {/* 6. Leak diagnosis. */}
      {stage === "leak" ? (
        <ScreenCalc
          session={view}
          onSubmit={(inputs) => {
            setCalcInputs(inputs);
            finish(inputs);
          }}
        />
      ) : null}

      {stage === "result" && calcInputs ? (
        <ScreenCalcResult
          session={view}
          inputs={calcInputs}
          elapsedMs={elapsedMs}
          onText={textResult}
          onBenchmark={(optIn) => queue.push("benchmark", { optIn })}
          textState={textState}
          onNext={() => advance("booking")}
        />
      ) : null}

      {/* 7. Out to the booking page. */}
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
 * about a minute, so a reload losing your place costs nothing — but resuming
 * means anyone opening the same link twice lands halfway through, which makes
 * the demo impossible to rehearse, impossible to show twice, and baffling when
 * a second person picks up the phone. Starting over is the behaviour everyone
 * expects from a link.
 *
 * ?resume=1 brings the old behaviour back for the one case it suits: someone
 * whose phone locked mid-flow and who wants to pick up where they were.
 */
function initialStage(session: ClientSession, resume: boolean): Stage {
  if (!resume) return "pin";
  if (session.calcInputs) return "result";
  if (session.techStack.length > 0) return "leak";
  if (session.paidAt) return "stack";
  if (session.cardAt) return "payment";
  if (session.capture.capturedAt) return "card";
  if (session.otpAt) return "landing";
  return "pin";
}
