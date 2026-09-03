"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, CapLabel, Check, Screen } from "@/components/ui";
import {
  ASSUMPTIONS,
  calculate,
  orderComponents,
  pct,
  roleLead,
  usd,
  usdRounded,
} from "@/lib/calc";
import { BOOKING_URL, PROSPECT_COPY as C, fill } from "@/lib/prospect-content";
import { ROLES } from "@/lib/demo";
import { FLOW } from "@/lib/flow-content";
import { Alert } from "@/components/Alert";
import { YosiLogo } from "@/components/YosiLogo";
import type { ClientSession } from "@/lib/session";
import { useCountUp } from "./CountUp";

/*
 * The patient-side done screen used to live here. It has been replaced by
 * ScreenProspectDone — same timer, but the claim is "that is what your patients
 * feel" rather than a boast about a roleplay, because the person holding the
 * phone is the buyer and the clock is on their own intake.
 */

/**
 * The leak calculator, folded in after the roleplay ends rather than run on a
 * separate tablet. Asking a "patient" how many patients they see a day would
 * break the frame at the exact moment it is working, so it waits until the
 * timer has landed and then hands them back their real job.
 *
 * Three sliders: one-handed, no keyboard, no typing a percentage into a phone.
 */
export function ScreenCalc({
  session,
  onSubmit,
}: {
  session: ClientSession;
  onSubmit: (inputs: {
    patientsPerDay: number;
    noShowRate: number;
    frontDeskStaff: number;
  }) => void;
}) {
  const [patientsPerDay, setPatients] = useState(
    session.calcInputs?.patientsPerDay ?? 40,
  );
  const [noShowPct, setNoShow] = useState(
    Math.round((session.calcInputs?.noShowRate ?? 0.12) * 100),
  );
  const [frontDeskStaff, setStaff] = useState(
    session.calcInputs?.frontDeskStaff ?? 3,
  );

  return (
    <Screen
      kicker={FLOW.leak.kicker}
      step={5}
      total={5}
      title={FLOW.leak.title}
      subtitle={FLOW.leak.subtitle}
      footer={
        <Button
          onClick={() =>
            onSubmit({ patientsPerDay, noShowRate: noShowPct / 100, frontDeskStaff })
          }
        >
          {FLOW.leak.cta}
        </Button>
      }
    >
      <div className="mb-5">
        <Alert>{FLOW.leak.alert}</Alert>
      </div>
      <div className="space-y-7">
        <Slider
          label={C.calc.labels.patientsPerDay}
          value={patientsPerDay}
          display={String(patientsPerDay)}
          min={5}
          max={150}
          step={5}
          onChange={setPatients}
        />
        <Slider
          label={C.calc.labels.noShowRate}
          value={noShowPct}
          display={`${noShowPct}%`}
          min={0}
          max={30}
          step={1}
          onChange={setNoShow}
        />
        <Slider
          label={C.calc.labels.frontDeskStaff}
          value={frontDeskStaff}
          display={String(frontDeskStaff)}
          min={1}
          max={12}
          step={1}
          onChange={setStaff}
        />
      </div>
    </Screen>
  );
}

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <CapLabel>{label}</CapLabel>
        <span className="text-[22px] font-extrabold tabular-nums tracking-[-0.02em] text-ink">
          {display}
        </span>
      </span>
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

/** The result. Assumptions are on the screen, not in a footnote. */
export function ScreenCalcResult({
  session,
  inputs,
  elapsedMs,
  onText,
  onBenchmark,
  textState,
  onNext,
}: {
  session: ClientSession;
  inputs: { patientsPerDay: number; noShowRate: number; frontDeskStaff: number };
  elapsedMs: number;
  onText: () => void;
  onBenchmark: (optIn: boolean) => void;
  textState: "idle" | "sending" | "sent";
  onNext: () => void;
}) {
  const result = useMemo(() => calculate(inputs), [inputs]);
  const ordered = orderComponents(result, session.role);
  const lead = roleLead(result, session.role);
  const shown = useCountUp(result.total, 1000);
  const [showWork, setShowWork] = useState(false);
  // Pre-checked: they have just been shown a number, and "how do I compare" is
  // the question they are already asking. Opting out is one tap.
  const [optIn, setOptIn] = useState(session.capture.optIn ?? true);

  // A default nobody taps is still a choice, and it has to reach the record —
  // otherwise every pre-ticked box reads as "declined" in the CSV. Written
  // once on mount, and only when they have not already answered.
  useEffect(() => {
    if (session.capture.optIn === null || session.capture.optIn === undefined) {
      onBenchmark(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen
      footer={
        <>
          {/* Texting it is the action worth taking: the number travels home,
              and it ties both halves of the booth to one phone number. So it
              is the filled CTA and it carries them forward, rather than
              sitting underneath Continue as an afterthought nobody taps. */}
          <Button
            onClick={() => {
              onText();
              onNext();
            }}
            disabled={textState !== "idle"}
          >
            {textState === "sent"
              ? C.calcResult.ctaSent
              : textState === "sending"
                ? C.calcResult.ctaSending
                : C.calcResult.cta}
          </Button>
          <button
            type="button"
            onClick={onNext}
            className="mt-1 min-h-[44px] w-full text-[13px] font-bold text-ink-sub"
          >
            {C.calcResult.skip}
          </button>
        </>
      }
    >
      <div className="animate-fade-up pt-6">
        <CapLabel>{C.calcResult.kicker}</CapLabel>
        <p className="mt-1.5 text-[44px] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
          {usdRounded(shown)}
        </p>
        {lead ? (
          <p className="mt-2.5 text-[14px] font-medium text-ink-sub">{lead}</p>
        ) : null}

        <div className="mt-6 space-y-2.5">
          {ordered.map((c) => (
            <div
              key={c.key}
              className="rounded-[14px] border border-hairline bg-white px-4 py-3.5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[14px] font-semibold text-ink">{c.label}</span>
                <span className="shrink-0 text-[15px] font-extrabold tabular-nums text-ink">
                  {usd(c.amount)}
                </span>
              </div>
              <p className="mt-1 text-[12px] font-medium leading-[1.45] text-ink-mute">
                {c.formula}
              </p>
              {c.note ? (
                <p className="mt-1.5 text-[12px] leading-[1.45] text-ink-sub">{c.note}</p>
              ) : null}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowWork((v) => !v)}
          className="mt-4 min-h-[44px] text-[13px] font-bold text-teal"
        >
          {showWork ? C.calcResult.hideWork : C.calcResult.showWork}
        </button>

        {showWork ? (
          <div className="mt-1 space-y-3 rounded-[14px] border border-hairline bg-white p-4">
            <p className="text-[12.5px] leading-[1.5] text-ink-sub">
              {C.calcResult.assumptionsIntro}
            </p>
            {Object.values(ASSUMPTIONS).map((a) => (
              <div key={a.label} className="border-t border-hairline pt-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-semibold text-ink">{a.label}</span>
                  <span className="shrink-0 text-[13px] font-bold tabular-nums text-ink">
                    {a.display}
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-[1.45] text-ink-mute">
                  {a.source}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <p className="mt-4 text-[12px] text-ink-mute">
          Based on {inputs.patientsPerDay} patients a day,{" "}
          {pct(inputs.noShowRate)} no-show, {inputs.frontDeskStaff} at the front desk.
        </p>

        <div className="mt-6 rounded-[14px] border border-hairline bg-white p-4">
          <p className="text-[14px] font-semibold text-ink">
            {C.calcResult.benchmarkTitle}
          </p>
          <p className="mt-1 text-[12.5px] leading-[1.5] text-ink-sub">
            {C.calcResult.benchmarkBody}
          </p>
          <button
            type="button"
            onClick={() => {
              const next = !optIn;
              setOptIn(next);
              onBenchmark(next);
            }}
            aria-pressed={optIn}
            className="mt-3 flex w-full items-center gap-3 text-left"
          >
            <span
              className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border transition ${
                optIn ? "border-teal bg-teal text-white" : "border-hairline bg-white"
              }`}
            >
              {optIn ? <Check className="h-3 w-3" /> : null}
            </span>
            <span className="text-[13.5px] font-semibold leading-[1.4] text-ink">
              {C.calcResult.benchmarkOptIn}
            </span>
          </button>
        </div>

        {elapsedMs > 0 && elapsedMs < 120_000 ? (
          <p className="mt-4 rounded-[12px] border border-teal/20 bg-teal-bg px-3.5 py-3 text-[13px] font-semibold leading-[1.45] text-ink">
            {fill(C.calcResult.elapsed, {
              seconds: Math.round(elapsedMs / 1000),
            })}
          </p>
        ) : null}
      </div>
    </Screen>
  );
}

/*
 * ScreenQualify (EHR + "how do patients fill this in now") used to live here.
 * It has been replaced by ScreenTechStack and ScreenCompetitor: at this show
 * nearly everyone answers athenahealth, so the EHR on its own buys a column
 * where every row is the same, whereas the stack tells you who else is in the
 * workflow and whether there is an incumbent to displace.
 */

/**
 * Lead capture, last. They have felt the product and seen their own number, so
 * the ask can be small and concrete. Nothing is pre-filled except the practice
 * name, and only if a rep typed it in before handing the phone over.
 *
 * The opt-in is doing the quiet work: it separates people who want a charger
 * from people who want information, and the second group is the pipeline.
 */
function fieldClass(invalid: boolean): string {
  return `mt-2 h-[52px] w-full rounded-[14px] border bg-white px-[14px] text-[16px] font-medium text-ink outline-none placeholder:text-ink-pale focus:ring-2 ${
    invalid
      ? "border-red focus:border-red focus:ring-red/20"
      : "border-hairline focus:border-teal focus:ring-teal/20"
  }`;
}

function FieldError({
  show,
  children,
}: {
  show: boolean;
  children: string | null;
}) {
  if (!show || !children) return null;
  return <p className="mt-1.5 text-[12.5px] font-semibold text-red">{children}</p>;
}

export function ScreenCapture({
  session,
  onSubmit,
}: {
  session: ClientSession;
  onSubmit: (body: Record<string, unknown>) => void;
}) {
  const c = session.capture;
  // "What brings you by" folded in as a field rather than its own screen —
  // it is one tap, it tags every lead by role, and it does not earn a step of
  // its own in a four-section flow.
  const [role, setRole] = useState(session.role ?? "");
  const [roleOther, setRoleOther] = useState(session.roleOther ?? "");
  const [name, setName] = useState(c.name ?? "");
  const [email, setEmail] = useState(c.email ?? "");
  const [practice, setPractice] = useState(c.practice ?? "");
  const [street, setStreet] = useState(c.street ?? "");
  const [unit, setUnit] = useState(c.unit ?? "");
  const [city, setCity] = useState(c.city ?? "");
  const [state, setState] = useState(c.state ?? "");
  const [zip, setZip] = useState(c.zip ?? "");
  // Set the first time they tap the button, so nothing is marked wrong before
  // they have had a go at it.
  const [attempted, setAttempted] = useState(false);

  // Separate refs rather than an object of them: reading `refs.email` in the
  // JSX counts as touching a ref during render, which the compiler rules
  // rightly flag. These are only dereferenced inside submit().
  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const streetRef = useRef<HTMLInputElement | null>(null);
  const cityRef = useRef<HTMLInputElement | null>(null);
  const stateRef = useRef<HTMLInputElement | null>(null);
  const zipRef = useRef<HTMLInputElement | null>(null);

  /**
   * The button stays enabled whether or not the form is filled. A disabled CTA
   * with no explanation is a dead end — you tap it, nothing happens, and
   * nothing on screen says why. Tapping names what is missing and jumps to it.
   */
  const errors: Record<string, string | null> = {
    name: name.trim().length > 1 ? null : "We need a name for the follow-up.",
    email: /\S+@\S+\.\S+/.test(email.trim())
      ? null
      : "A work email we can actually reach you at.",
    street: street.trim().length > 3 ? null : "Street address.",
    city: city.trim().length > 1 ? null : "City.",
    state: /^[A-Za-z]{2}$/.test(state.trim()) ? null : "Two letters.",
    zip: /^\d{5}(-\d{4})?$/.test(zip.trim()) ? null : "Five digits.",
  };
  const order = ["name", "email", "street", "city", "state", "zip"] as const;
  const firstError = order.find((k) => errors[k]);

  const submit = () => {
    if (!firstError) {
      onSubmit({
        role,
        roleOther: role === "other" ? roleOther : "",
        name,
        email,
        practice,
        street,
        unit,
        city,
        state,
        zip,
      });
      return;
    }
    setAttempted(true);
    const target = {
      name: nameRef,
      email: emailRef,
      street: streetRef,
      city: cityRef,
      state: stateRef,
      zip: zipRef,
    }[firstError];
    target.current?.focus();
    target.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const bad = (k: string) => attempted && Boolean(errors[k]);

  return (
    <Screen
      kicker={FLOW.demographics.kicker}
      step={1}
      total={5}
      title={FLOW.demographics.title}
      subtitle={FLOW.demographics.subtitle}
      footer={
        <>
          <Button onClick={submit}>{FLOW.demographics.cta}</Button>
          <p className="mt-2 text-center text-[12px] text-ink-mute">
            {attempted && firstError
              ? FLOW.demographics.fixIt
              : FLOW.demographics.footnote}
          </p>
        </>
      }
    >
      <div className="mb-5">
        <Alert>{FLOW.demographics.alert}</Alert>
      </div>

      <div className="space-y-4">
        <div>
          <CapLabel>{FLOW.demographics.roleLabel}</CapLabel>
          {/* Chips rather than stacked radio bars: it is one line instead of
              four, and "Other" can open a field without the layout jumping. */}
          <div className="mt-2 flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setRole(r.id);
                  setRoleOther("");
                }}
                aria-pressed={role === r.id}
                className={`min-h-[42px] rounded-full border-2 px-4 text-[13.5px] font-semibold transition active:scale-[0.97] ${
                  role === r.id
                    ? "border-blue bg-blue text-white"
                    : "border-blue/40 bg-white text-ink"
                }`}
              >
                {r.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRole("other")}
              aria-pressed={role === "other"}
              className={`min-h-[42px] rounded-full border-2 px-4 text-[13.5px] font-semibold transition active:scale-[0.97] ${
                role === "other"
                  ? "border-blue bg-blue text-white"
                  : "border-blue/40 bg-white text-ink"
              }`}
            >
              {FLOW.demographics.roleOther}
            </button>
          </div>
          {role === "other" ? (
            <input
              autoFocus
              value={roleOther}
              onChange={(e) => setRoleOther(e.target.value)}
              placeholder={FLOW.demographics.roleOtherPlaceholder}
              className={`${fieldClass(false)} animate-fade-up`}
            />
          ) : null}
        </div>

        <label className="block">
          <CapLabel>{FLOW.demographics.labels.name}</CapLabel>
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder={FLOW.demographics.placeholders.name}
            aria-invalid={bad("name")}
            className={fieldClass(bad("name"))}
          />
          <FieldError show={attempted}>{errors.name}</FieldError>
        </label>

        <label className="block">
          <CapLabel>{FLOW.demographics.labels.email}</CapLabel>
          <input
            ref={emailRef}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={FLOW.demographics.placeholders.email}
            aria-invalid={bad("email")}
            className={fieldClass(bad("email"))}
          />
          <FieldError show={attempted}>{errors.email}</FieldError>
        </label>

        <label className="block">
          <CapLabel>{FLOW.demographics.labels.practice}</CapLabel>
          <input
            value={practice}
            onChange={(e) => setPractice(e.target.value)}
            autoComplete="organization"
            placeholder={FLOW.demographics.placeholders.practice}
            className={fieldClass(false)}
          />
        </label>

        <div className="pt-1">
          <Alert>{FLOW.demographics.addressAlert}</Alert>
        </div>

        <label className="block">
          <CapLabel>{FLOW.demographics.labels.street}</CapLabel>
          <input
            ref={streetRef}
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            autoComplete="address-line1"
            placeholder={FLOW.demographics.placeholders.street}
            aria-invalid={bad("street")}
            className={fieldClass(bad("street"))}
          />
          <FieldError show={attempted}>{errors.street}</FieldError>
        </label>

        <label className="block">
          <CapLabel>{FLOW.demographics.labels.unit}</CapLabel>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            autoComplete="address-line2"
            placeholder={FLOW.demographics.placeholders.unit}
            className={fieldClass(false)}
          />
        </label>

        {/* City takes the width it needs; state and ZIP are short and sit on
            one row so the form does not read as six identical boxes. */}
        <div className="grid grid-cols-[1fr_74px_104px] gap-2">
          <label className="block">
            <CapLabel>{FLOW.demographics.labels.city}</CapLabel>
            <input
              ref={cityRef}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="address-level2"
              placeholder={FLOW.demographics.placeholders.city}
              aria-invalid={bad("city")}
              className={fieldClass(bad("city"))}
            />
          </label>
          <label className="block">
            <CapLabel>{FLOW.demographics.labels.state}</CapLabel>
            <input
              ref={stateRef}
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
              autoComplete="address-level1"
              placeholder={FLOW.demographics.placeholders.state}
              maxLength={2}
              aria-invalid={bad("state")}
              className={`${fieldClass(bad("state"))} text-center uppercase`}
            />
          </label>
          <label className="block">
            <CapLabel>{FLOW.demographics.labels.zip}</CapLabel>
            <input
              ref={zipRef}
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/[^\d-]/g, "").slice(0, 10))}
              autoComplete="postal-code"
              inputMode="numeric"
              placeholder={FLOW.demographics.placeholders.zip}
              aria-invalid={bad("zip")}
              className={fieldClass(bad("zip"))}
            />
          </label>
        </div>
        {attempted && (errors.city || errors.state || errors.zip) ? (
          <p className="-mt-2 text-[12.5px] font-semibold text-red">
            City, state and ZIP so it can actually be posted.
          </p>
        ) : null}

      </div>
    </Screen>
  );
}

export function ScreenThanks({
  session,
  leakTotal,
  onBooked,
}: {
  session: ClientSession;
  /**
   * Passed in rather than read off the session: the page was server-rendered
   * before the calculator ran, so the snapshot has no result and the headline
   * would fall back to the generic line — losing the one number that makes
   * this screen a close rather than a thank-you.
   */
  leakTotal: number | null;
  onBooked: () => void;
}) {
  const [opened, setOpened] = useState(Boolean(session.capture.bookedAt));
  const total = leakTotal;

  return (
    <Screen
      kicker={FLOW.booking.kicker}
      title={
        total
          ? fill(FLOW.booking.title, { leak: usdRounded(total) })
          : FLOW.booking.titleNoLeak
      }
      subtitle={FLOW.booking.subtitle}
      footer={
        <>
          {/* target=_blank so the click records and this page does not unload
              mid-request. Everyone without the stamp is the retarget list. */}
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              setOpened(true);
              onBooked();
            }}
            className="flex min-h-[54px] w-full items-center justify-center rounded-[16px] bg-blue text-[15px] font-bold text-white shadow-[0_4px_8px_0_rgba(11,165,180,0.3)] transition active:scale-[0.985]"
          >
            {FLOW.booking.cta}
          </a>
          <p className="mt-2 text-center text-[12px] text-ink-mute">
            {opened ? FLOW.booking.opened : FLOW.booking.footnote}
          </p>
        </>
      }
    >
      <Alert>{FLOW.booking.alert}</Alert>

      <div className="mt-10 flex justify-center">
        <YosiLogo className="h-8 opacity-90" />
      </div>
    </Screen>
  );
}
