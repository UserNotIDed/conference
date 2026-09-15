"use client";

import { useState } from "react";
import { Button, CapLabel, Screen } from "@/components/ui";
import { Alert } from "@/components/Alert";
import { FLOW } from "@/lib/flow-content";
import { INPUT_DEFAULTS, type CalcInputs } from "@/lib/calc";
import type { ClientSession } from "@/lib/session";

/**
 * Section 3 — the five numbers.
 *
 * Sliders rather than fields: one-handed, no keyboard, and nothing to get
 * wrong. Typing "12%" into a phone in a loud room is how you lose someone at
 * the last question.
 *
 * Four questions, not five. Minutes per patient on registration is fixed at
 * 14 in calc.ts rather than asked: it is a number most people guess badly and
 * slowly, and a slider nobody can answer confidently costs more time than the
 * precision buys. It is still printed in the assumptions, tagged as ours.
 */
export function ScreenNumbers({
  session,
  onSubmit,
}: {
  session: ClientSession;
  onSubmit: (inputs: CalcInputs) => void;
}) {
  const saved = session.calcInputs;
  const [v, setV] = useState<CalcInputs>({
    patientsPerDay: saved?.patientsPerDay ?? INPUT_DEFAULTS.patientsPerDay,
    noShowRate: saved?.noShowRate ?? INPUT_DEFAULTS.noShowRate,
    frontDeskStaff: saved?.frontDeskStaff ?? INPUT_DEFAULTS.frontDeskStaff,
    collectedRate: saved?.collectedRate ?? INPUT_DEFAULTS.collectedRate,
  });
  const set = <K extends keyof CalcInputs>(k: K) => (n: number) =>
    setV((prev) => ({ ...prev, [k]: n }));

  const L = FLOW.numbers.labels;

  return (
    <Screen
      kicker={FLOW.numbers.kicker}
      step={3}
      total={3}
      title={FLOW.numbers.title}
      subtitle={FLOW.numbers.subtitle}
      footer={<Button onClick={() => onSubmit(v)}>{FLOW.numbers.cta}</Button>}
    >
      <div className="mb-6">
        <Alert>{FLOW.numbers.alert}</Alert>
      </div>
      <div className="space-y-7">
        <Slider
          label={L.patientsPerDay}
          display={String(v.patientsPerDay)}
          value={v.patientsPerDay}
          min={5}
          max={150}
          step={5}
          onChange={set("patientsPerDay")}
        />
        <Slider
          label={L.noShowRate}
          display={`${Math.round(v.noShowRate * 100)}%`}
          value={Math.round(v.noShowRate * 100)}
          min={0}
          max={30}
          step={1}
          onChange={(n) => set("noShowRate")(n / 100)}
        />
        <Slider
          label={L.frontDeskStaff}
          display={String(v.frontDeskStaff)}
          value={v.frontDeskStaff}
          min={1}
          max={12}
          step={1}
          onChange={set("frontDeskStaff")}
        />
        <Slider
          label={L.collectedRate}
          hint={FLOW.numbers.hints.collectedRate}
          display={`${Math.round(v.collectedRate * 100)}%`}
          value={Math.round(v.collectedRate * 100)}
          min={0}
          max={100}
          step={5}
          onChange={(n) => set("collectedRate")(n / 100)}
        />
      </div>
    </Screen>
  );
}

function Slider({
  label,
  hint,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <CapLabel>{label}</CapLabel>
        <span className="shrink-0 text-[22px] font-extrabold tabular-nums tracking-[-0.02em] text-ink">
          {display}
        </span>
      </span>
      {hint ? (
        <span className="mt-1 block text-[12px] leading-[1.4] text-ink-mute">
          {hint}
        </span>
      ) : null}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-11 w-full cursor-pointer appearance-none bg-transparent
          [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-hairline
          [&::-webkit-slider-thumb]:-mt-[13px] [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-teal [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(11,165,180,0.4)]
          [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-hairline
          [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-teal"
      />
    </label>
  );
}
