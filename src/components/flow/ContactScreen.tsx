"use client";

import { useRef, useState } from "react";
import { Button, CapLabel, Screen } from "@/components/ui";
import { Alert } from "@/components/Alert";
import { ROLES } from "@/lib/demo";
import { FLOW } from "@/lib/flow-content";
import type { ClientSession } from "@/lib/session";

/**
 * Section 1. Who they are.
 *
 * Every field on this screen is a lead field, and the screen is first rather
 * than last because the charger is the reason they stopped walking. Asking at
 * the end means the people who drift off cost us the record as well as the
 * conversation.
 *
 * The role chips are folded in rather than given a screen of their own: it is
 * one tap, it tags the lead, and it decides which component gets read first on
 * the money screen.
 */

function fieldClass(invalid: boolean): string {
  return `mt-2 h-[52px] w-full rounded-[14px] border bg-white px-[14px] text-[16px] font-medium text-ink outline-none placeholder:text-ink-pale focus:ring-2 ${
    invalid
      ? "border-red focus:border-red focus:ring-red/20"
      : "border-hairline focus:border-teal focus:ring-teal/20"
  }`;
}

function FieldError({ show, children }: { show: boolean; children: string | null }) {
  if (!show || !children) return null;
  return <p className="mt-1.5 text-[12.5px] font-semibold text-red">{children}</p>;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[42px] rounded-full border-2 px-4 text-[13.5px] font-semibold transition active:scale-[0.97] ${
        active ? "border-blue bg-blue text-white" : "border-blue/40 bg-white text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function ScreenContact({
  session,
  onSubmit,
}: {
  session: ClientSession;
  onSubmit: (body: Record<string, unknown>) => void;
}) {
  const c = session.capture;
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
   * with no explanation is a dead end: you tap it, nothing happens, and
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
  const F = FLOW.contact;

  return (
    <Screen
      kicker={F.kicker}
      step={1}
      total={3}
      title={F.title}
      subtitle={F.subtitle}
      footer={
        <>
          <Button onClick={submit}>{F.cta}</Button>
          <p className="mt-2 text-center text-[12px] text-ink-mute">
            {attempted && firstError ? F.fixIt : F.footnote}
          </p>
        </>
      }
    >
      <div className="mb-5">
        <Alert>{F.alert}</Alert>
      </div>

      <div className="space-y-4">
        <div>
          <CapLabel>{F.roleLabel}</CapLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <Chip
                key={r.id}
                active={role === r.id}
                onClick={() => {
                  setRole(r.id);
                  setRoleOther("");
                }}
              >
                {r.label}
              </Chip>
            ))}
            <Chip active={role === "other"} onClick={() => setRole("other")}>
              {F.roleOther}
            </Chip>
          </div>
          {role === "other" ? (
            <input
              autoFocus
              value={roleOther}
              onChange={(e) => setRoleOther(e.target.value)}
              placeholder={F.roleOtherPlaceholder}
              className={`${fieldClass(false)} animate-fade-up`}
            />
          ) : null}
        </div>

        <label className="block">
          <CapLabel>{F.labels.name}</CapLabel>
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder={F.placeholders.name}
            aria-invalid={bad("name")}
            className={fieldClass(bad("name"))}
          />
          <FieldError show={attempted}>{errors.name}</FieldError>
        </label>

        <label className="block">
          <CapLabel>{F.labels.email}</CapLabel>
          <input
            ref={emailRef}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={F.placeholders.email}
            aria-invalid={bad("email")}
            className={fieldClass(bad("email"))}
          />
          <FieldError show={attempted}>{errors.email}</FieldError>
        </label>

        <label className="block">
          <CapLabel>{F.labels.practice}</CapLabel>
          <input
            value={practice}
            onChange={(e) => setPractice(e.target.value)}
            autoComplete="organization"
            placeholder={F.placeholders.practice}
            className={fieldClass(false)}
          />
        </label>

        <label className="block">
          <CapLabel>{F.labels.street}</CapLabel>
          <input
            ref={streetRef}
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            autoComplete="address-line1"
            placeholder={F.placeholders.street}
            aria-invalid={bad("street")}
            className={fieldClass(bad("street"))}
          />
          <FieldError show={attempted}>{errors.street}</FieldError>
        </label>

        <label className="block">
          <CapLabel>{F.labels.unit}</CapLabel>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            autoComplete="address-line2"
            placeholder={F.placeholders.unit}
            className={fieldClass(false)}
          />
        </label>

        {/* City takes the width it needs; state and ZIP are short and sit on
            one row so the form does not read as six identical boxes. */}
        <div className="grid grid-cols-[1fr_74px_104px] gap-2">
          <label className="block">
            <CapLabel>{F.labels.city}</CapLabel>
            <input
              ref={cityRef}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="address-level2"
              placeholder={F.placeholders.city}
              aria-invalid={bad("city")}
              className={fieldClass(bad("city"))}
            />
          </label>
          <label className="block">
            <CapLabel>{F.labels.state}</CapLabel>
            <input
              ref={stateRef}
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
              autoComplete="address-level1"
              placeholder={F.placeholders.state}
              maxLength={2}
              aria-invalid={bad("state")}
              className={`${fieldClass(bad("state"))} text-center uppercase`}
            />
          </label>
          <label className="block">
            <CapLabel>{F.labels.zip}</CapLabel>
            <input
              ref={zipRef}
              value={zip}
              onChange={(e) =>
                setZip(e.target.value.replace(/[^\d-]/g, "").slice(0, 10))
              }
              autoComplete="postal-code"
              inputMode="numeric"
              placeholder={F.placeholders.zip}
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
