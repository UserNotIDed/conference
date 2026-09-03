"use client";

import { useEffect, useState } from "react";
import { Button, CapLabel, Check, Screen } from "@/components/ui";
import { Alert } from "@/components/Alert";
import { FLOW } from "@/lib/flow-content";
import { fill } from "@/lib/prospect-content";

/**
 * Copay collection.
 *
 * Sequenced straight after eligibility because that is the order it happens
 * in: the payer comes back with a copay, and the ask goes out while the phone
 * is still in the patient's hand. No card is charged — the field is a display
 * of a card already on file, and the "processing" beat is a timer.
 */
export function ScreenPayment({
  amountCents,
  onNext,
}: {
  amountCents: number;
  onNext: (paid: boolean) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "paying" | "paid">("idle");
  const amount = `$${(amountCents / 100).toFixed(2)}`;

  useEffect(() => {
    if (phase !== "paying") return;
    const t = setTimeout(() => setPhase("paid"), 1400);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <Screen
      kicker={FLOW.payment.kicker}
      step={3}
      total={5}
      title={FLOW.payment.title}
      subtitle={FLOW.payment.subtitle}
      footer={
        phase === "paid" ? (
          <Button onClick={() => onNext(true)}>
            {FLOW.payment.continueCta}
          </Button>
        ) : (
          <>
            <Button
              disabled={phase === "paying"}
              onClick={() => setPhase("paying")}
            >
              {phase === "paying"
                ? FLOW.payment.paying
                : fill(FLOW.payment.cta, { amount })}
            </Button>
            <button
              type="button"
              onClick={() => onNext(false)}
              className="mt-1 min-h-[44px] w-full text-[13px] font-bold text-ink-sub"
            >
              {FLOW.payment.skipCta}
            </button>
          </>
        )
      }
    >
      <div className="rounded-[18px] border border-hairline bg-white p-5">
        <CapLabel>{FLOW.payment.dueLabel}</CapLabel>
        <p className="mt-1.5 text-[40px] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
          {amount}
        </p>

        {phase === "paid" ? (
          <div className="mt-4 flex items-center gap-2.5 rounded-[12px] border border-green/25 bg-green-bg px-3 py-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green text-white">
              <Check className="h-3 w-3" />
            </span>
            <span className="text-[13px] font-semibold text-ink">
              {FLOW.payment.paidTitle} · {FLOW.payment.paidNote}
            </span>
          </div>
        ) : (
          <div className="mt-4">
            <CapLabel>{FLOW.payment.cardLabel}</CapLabel>
            <div className="mt-2 flex h-[52px] items-center rounded-[14px] border border-hairline bg-canvas px-[14px] text-[15px] font-semibold text-ink-sub">
              {FLOW.payment.cardPlaceholder}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <Alert>{FLOW.payment.multiLocation}</Alert>
        <Alert tone={phase === "paid" ? "success" : "info"}>
          {FLOW.payment.alert}
        </Alert>
      </div>
    </Screen>
  );
}
