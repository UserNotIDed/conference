"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check } from "./ui";
import { CloseIcon } from "./icons";

/**
 * Scan-with-fallback, ported from the CaptureModule pattern in the main app.
 *
 * Two things it keeps from the original: the camera is the primary path and
 * manual entry is always offered, and the "reading…" beat is visible rather
 * than instant, because the pause is what makes OCR legible as work.
 *
 * The difference here is that the camera is real. `capture="environment"` on a
 * file input opens the rear camera with no getUserMedia permission dance and no
 * video pipeline to keep alive on a borrowed phone. The photo never leaves the
 * device — we show it back, then hand over the canned read.
 */
export function Capture<T>({
  icon,
  scanTitle,
  scanSubtitle,
  readingTitle,
  cannedData,
  readMs = 1500,
  onCapture,
  renderCaptured,
  renderManual,
  manualLabel = "Enter details manually",
  captured,
}: {
  icon: ReactNode;
  scanTitle: string;
  scanSubtitle: string;
  readingTitle: string;
  cannedData: T;
  readMs?: number;
  onCapture: (data: T, manual: boolean) => void;
  renderCaptured: (data: T, rescan: () => void, preview: string | null) => ReactNode;
  renderManual?: () => ReactNode;
  manualLabel?: string;
  captured: T | null;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [manual, setManual] = useState(false);

  // Two separate lifetimes, deliberately not combined. Revoking the object URL
  // belongs to `preview` and must run when it changes; cancelling the read
  // belongs to the component. Sharing one effect meant setting the preview
  // re-ran the cleanup and cancelled the read that had just started, so the
  // scan sat on "Reading…" forever.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (manual && renderManual) {
    return (
      <div>
        {renderManual()}
        <button
          type="button"
          onClick={() => setManual(false)}
          className="mt-3 min-h-[44px] text-[13px] font-bold text-teal"
        >
          Use the camera instead
        </button>
      </div>
    );
  }

  if (captured) return <>{renderCaptured(captured, () => setPreview(null), preview)}</>;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setPreview(URL.createObjectURL(file));
          setReading(true);
          timer.current = setTimeout(() => {
            setReading(false);
            onCapture(cannedData, false);
          }, readMs);
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={reading}
        className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[18px] border-2 border-dashed border-teal/30 bg-teal-bg px-6 py-10 transition active:scale-[0.99]"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        ) : null}
        <span
          className={`relative flex h-16 w-16 items-center justify-center rounded-full border border-teal/20 bg-white text-teal ${
            reading ? "animate-pulse" : ""
          }`}
        >
          {icon}
        </span>
        <span className="relative mt-4 text-[16px] font-bold text-teal">
          {reading ? readingTitle : scanTitle}
        </span>
        <span className="relative mt-1 text-[12px] font-medium text-teal/70">
          {reading ? "Hold steady" : scanSubtitle}
        </span>
      </button>

      {renderManual ? (
        <button
          type="button"
          onClick={() => setManual(true)}
          className="mt-3 h-12 w-full rounded-[14px] border border-hairline bg-white text-[13px] font-semibold text-ink transition active:scale-[0.98]"
        >
          {manualLabel}
        </button>
      ) : null}
    </div>
  );
}

/** The captured-state card both captures share. */
export function CapturedCard({
  label,
  rows,
  preview,
  onRescan,
}: {
  label: string;
  rows: { label: string; value: string }[];
  preview: string | null;
  onRescan: () => void;
}) {
  return (
    <div className="rounded-[18px] border border-teal/30 bg-white px-[18px] py-4 shadow-[0_4px_24px_0_rgba(11,165,180,0.10)]">
      <div className="flex items-center gap-2 text-green">
        <Check className="h-4 w-4" />
        <span className="text-[11px] font-bold uppercase tracking-[0.06em]">
          {label}
        </span>
      </div>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="The card you photographed"
          className="mt-3 aspect-[1.586/1] w-full rounded-[12px] border border-hairline object-cover"
        />
      ) : null}
      <div className="mt-3 space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-ink-mute">
              {r.label}
            </span>
            <span className="text-right text-[14px] font-semibold text-ink">
              {r.value}
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onRescan}
        className="mt-3 min-h-[44px] text-[12px] font-semibold text-teal active:opacity-60"
      >
        Re-scan
      </button>
    </div>
  );
}

/**
 * Bottom sheet for consent text. Focus is moved in on open and the page behind
 * is locked, because a sheet you can scroll past is a sheet nobody read.
 */
export function Sheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const panel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    panel.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40"
      />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-fade-up relative mx-auto flex max-h-[86dvh] w-full max-w-[430px] flex-col rounded-t-[22px] bg-white outline-none"
      >
        <header className="flex items-start gap-3 border-b border-hairline px-5 py-4">
          <h2 className="flex-1 text-[17px] font-extrabold leading-snug tracking-[-0.01em] text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 flex h-11 w-11 items-center justify-center text-ink-mute"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
        {footer ? (
          <div className="pb-thumb border-t border-hairline px-5 pt-3">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
