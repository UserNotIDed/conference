"use client";

import { Button, CapLabel, Check, Screen } from "@/components/ui";
import { Alert } from "@/components/Alert";
import { ReadinessRing } from "@/components/ReadinessRing";
import { YosiLogo } from "@/components/YosiLogo";
import { ChevronRight } from "@/components/icons";
import { FLOW } from "@/lib/flow-content";

export type SectionState = {
  id: string;
  label: string;
  note: string;
  done: boolean;
  action?: string;
  icon: "person" | "card" | "wallet" | "stack" | "chart";
};

/**
 * The hub, built to the shape of the patient one: logo in the header, a visit
 * card carrying the readiness ring and the primary action, then a "what to do"
 * list of tappable rows with an icon chip on the left and an action on the
 * right.
 *
 * It exists so nobody starts a form without seeing its shape, and so the
 * prospect meets the screen their patients meet — which is the thing being
 * sold.
 */
export function ScreenLanding({
  sections,
  onStart,
  onJump,
}: {
  sections: SectionState[];
  onStart: () => void;
  onJump: (id: string) => void;
}) {
  const doneCount = sections.filter((s) => s.done).length;
  const percent = (doneCount / sections.length) * 100;
  const started = doneCount > 0;

  return (
    <Screen>
      <header className="mb-5 flex items-center justify-between">
        <CapLabel>{FLOW.landing.kicker}</CapLabel>
        <YosiLogo className="h-6" />
      </header>

      <div className="overflow-hidden rounded-[18px] border border-hairline bg-white">
        <div className="flex items-start justify-between gap-4 p-5">
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink">
              {FLOW.landing.title}
            </h1>
            <span className="mt-2 inline-block rounded-full border border-blue/30 px-2.5 py-1 text-[11px] font-bold text-blue">
              {FLOW.landing.badge}
            </span>
            <div className="mt-3 space-y-1.5">
              <Meta icon="person" text={FLOW.landing.metaWho} />
              <Meta icon="clock" text={FLOW.landing.metaTime} />
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center">
            <ReadinessRing percent={percent} size={96} />
            <span className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.06em] text-ink-mute">
              {FLOW.landing.scoreLabel}
            </span>
          </div>
        </div>

        <div className="border-t border-hairline p-4">
          <Button onClick={onStart}>
            {started ? FLOW.landing.resumeCta : FLOW.landing.startCta} →
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <CapLabel>{FLOW.landing.sectionsLabel}</CapLabel>
        <ol className="mt-2.5 space-y-2.5">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => onJump(section.id)}
                className={`flex w-full items-center gap-3 rounded-[14px] border bg-white px-3 py-3 text-left transition active:scale-[0.99] ${
                  section.done ? "border-green/30" : "border-hairline"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                    section.done
                      ? "bg-green-bg text-green"
                      : "bg-teal-bg text-teal"
                  }`}
                >
                  {section.done ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <SectionIcon name={section.icon} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-bold text-ink">
                    {section.label}
                  </span>
                  <span className="mt-0.5 block text-[12px] font-medium leading-[1.35] text-ink-sub">
                    {section.done ? "Done" : section.note}
                  </span>
                </span>
                {section.done ? (
                  <span className="shrink-0 rounded-full bg-green px-2.5 py-1 text-[11px] font-bold text-white">
                    Done
                  </span>
                ) : section.action ? (
                  <span className="shrink-0 rounded-full bg-amber-strong px-3 py-1.5 text-[12px] font-bold text-white">
                    {section.action}
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-pale" />
                )}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-5 pb-2">
        <Alert>{FLOW.landing.alert}</Alert>
      </div>

      <p className="pb-thumb pt-3 text-center text-[12px] text-ink-mute">
        {FLOW.landing.footnote}
      </p>
    </Screen>
  );
}

function Meta({ icon, text }: { icon: "person" | "clock"; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-ink-mute">
        {icon === "person" ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.7" />
            <path d="M5.5 19.5c.9-3.3 3.4-5 6.5-5s5.6 1.7 6.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-[13px] font-medium text-ink-sub">{text}</span>
    </div>
  );
}

function SectionIcon({ name }: { name: SectionState["icon"] }) {
  const common = { className: "h-[18px] w-[18px]", fill: "none", viewBox: "0 0 24 24" };
  switch (name) {
    case "person":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5.5 19.5c.9-3.3 3.4-5 6.5-5s5.6 1.7 6.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "card":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="6" width="18" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="6" width="18" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="16.5" cy="12" r="1.4" fill="currentColor" />
        </svg>
      );
    case "stack":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 4 21 8.5 12 13 3 8.5 12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M3 13.5 12 18l9-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 19.5V10M10 19.5V5M16 19.5v-6M21 19.5H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
}
