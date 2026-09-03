"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

/**
 * The small set of controls the booth flow needs, in the Yosi system.
 * Blue is the one filled CTA colour; teal is accent and selection; everything
 * sits on hairline borders rather than shadows. Minimum 44px tap targets, and
 * the primary CTA is 54px because it is hit with a thumb in a loud room.
 */

export function CapLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`block text-[11px] font-bold uppercase tracking-[0.06em] text-ink-mute ${className}`}
    >
      {children}
    </span>
  );
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost" | "quiet";
  }
>(function Button({ variant = "primary", className = "", ...props }, ref) {
  const base =
    "w-full min-h-[54px] rounded-[16px] text-[15px] font-bold transition-[transform,opacity] active:scale-[0.985] disabled:opacity-40 disabled:active:scale-100";
  const styles = {
    primary: "bg-blue text-white shadow-[0_4px_8px_0_rgba(11,165,180,0.3)]",
    ghost: "bg-white text-ink border border-hairline",
    quiet: "min-h-[44px] text-ink-sub font-semibold",
  }[variant];
  return <button ref={ref} className={`${base} ${styles} ${className}`} {...props} />;
});

export const Field = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }
>(function Field({ label, hint, className = "", ...props }, ref) {
  return (
    <label className="block">
      <CapLabel>{label}</CapLabel>
      <input
        ref={ref}
        className={`mt-2 h-[52px] w-full rounded-[14px] border border-hairline bg-white px-[14px] text-[16px] font-medium text-ink outline-none placeholder:text-ink-pale focus:border-teal focus:ring-2 focus:ring-teal/20 ${className}`}
        {...props}
      />
      {hint ? <p className="mt-1.5 text-[12px] text-ink-mute">{hint}</p> : null}
    </label>
  );
});

/** Teal progress rail. Two channels: how far along, and that it is moving. */
export function Progress({ step, total }: { step: number; total: number }) {
  const pctDone = Math.max(0, Math.min(1, step / total));
  return (
    <div
      className="h-[5px] w-full overflow-hidden rounded-full bg-hairline"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`Step ${step} of ${total}`}
    >
      <div
        className="h-full rounded-full bg-teal transition-[width] duration-300 ease-out"
        style={{ width: `${pctDone * 100}%` }}
      />
    </div>
  );
}

/**
 * The phone-shaped shell every attendee screen sits in. On a phone it is just
 * the viewport; on the booth laptop it centres in a frame so a rep can drive
 * it on a big screen without it looking like a stretched web page.
 */
export function Screen({
  kicker,
  step,
  total,
  title,
  subtitle,
  children,
  footer,
}: {
  kicker?: string;
  step?: number;
  total?: number;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-white">
      {kicker || step ? (
        <header className="px-5 pt-5">
          {kicker ? (
            <CapLabel className="!text-ink-sub">{kicker}</CapLabel>
          ) : null}
          {step && total ? (
            <div className="mt-2.5">
              <Progress step={step} total={total} />
              <p className="mt-2 text-[12px] font-medium text-ink-mute">
                Step {step} of {total}
              </p>
            </div>
          ) : null}
        </header>
      ) : null}

      <div className="flex-1 px-5 pt-4">
        {title ? (
          <h1 className="text-[26px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink">
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p className="mt-1.5 text-[14px] font-medium leading-[1.45] text-ink-sub">
            {subtitle}
          </p>
        ) : null}
        <div className={title ? "mt-6" : ""}>{children}</div>
      </div>

      {footer ? <div className="pb-thumb px-5 pt-4">{footer}</div> : null}
    </div>
  );
}

export function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 10.5 8 14.5 16 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        opacity="0.2"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
