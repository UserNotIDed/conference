"use client";

import { useMemo, useState } from "react";
import {
  EMAIL_PRESETS,
  presetById,
  renderEmail,
  type EmailMode,
} from "@/lib/email";


/**
 * The follow-up email, side by side with the thing you paste into HubSpot.
 *
 * Two controls only: who it is for, and which render. Everything else moves by
 * changing calc.ts or score.ts, the same as the flow. The email is not a
 * separate set of numbers and must never become one.
 */

export function EmailPreview() {
  const [presetId, setPresetId] = useState(EMAIL_PRESETS[0].id);
  const [mode, setMode] = useState<EmailMode>("preview");
  const [copied, setCopied] = useState(false);

  const preset = presetById(presetId);
  const email = useMemo(
    () =>
      renderEmail(preset, mode),
    [preset, mode],
  );

  const src = `/api/email?preset=${preset.id}&mode=${mode}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email.html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy the HTML", email.html);
    }
  };

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="border-b border-hairline bg-white px-5 py-5 lg:h-dvh lg:w-[340px] lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-teal">
          Yosi booth
        </p>
        <h1 className="mt-1.5 text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
          The follow-up email
        </h1>
        <p className="mt-2 text-[12.5px] leading-[1.5] text-ink-sub">
          HubSpot sends this, not us: a workflow on the{" "}
          <em>Booth: diagnosis</em> form submission. Nothing here is computed at
          send time; every figure is a contact property we wrote when they
          finished.
        </p>

        <section className="mt-5">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-mute">
            Render
          </h2>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {(["preview", "hubspot"] as EmailMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`min-h-[40px] rounded-[10px] border-2 px-2 text-[12.5px] font-bold transition ${
                  mode === m
                    ? "border-blue bg-blue text-white"
                    : "border-blue/30 bg-white text-ink"
                }`}
              >
                {m === "preview" ? "Real values" : "HubSpot tokens"}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11.5px] leading-[1.45] text-ink-mute">
            {mode === "preview"
              ? "What the recipient sees. Use this to argue about the copy."
              : "What you paste into HubSpot. Every value is a {{ contact.booth_* }} token, and the score bars are dropped, because HubSpot cannot do arithmetic and a bar at the wrong length is a lie."}
          </p>
        </section>

        <section className="mt-5">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-mute">
            Who it is for
          </h2>
          <div className="mt-2 space-y-1">
            {EMAIL_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPresetId(p.id)}
                className={`w-full rounded-[10px] px-3 py-2 text-left transition ${
                  presetId === p.id ? "bg-teal-bg" : "hover:bg-canvas"
                }`}
              >
                <span
                  className={`block text-[13.5px] font-bold ${
                    presetId === p.id ? "text-teal" : "text-ink"
                  }`}
                >
                  {p.label}
                </span>
                <span className="mt-0.5 block text-[11.5px] leading-[1.4] text-ink-mute">
                  {p.inputs.patientsPerDay}/day · {Math.round(p.inputs.noShowRate * 100)}%
                  no-show · {p.inputs.frontDeskStaff} FTE ·{" "}
                  {Math.round(p.inputs.collectedRate * 100)}% collected
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-mute">
            Subject
          </h2>
          <p className="mt-2 rounded-[10px] border border-hairline bg-canvas px-3 py-2 text-[12.5px] font-semibold leading-[1.45] text-ink">
            {email.subject}
          </p>
          <h2 className="mt-4 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-mute">
            Preheader
          </h2>
          <p className="mt-2 rounded-[10px] border border-hairline bg-canvas px-3 py-2 text-[12.5px] leading-[1.45] text-ink-sub">
            {email.preheader}
          </p>
        </section>

        <button
          type="button"
          onClick={copy}
          className="mt-5 min-h-[48px] w-full rounded-[12px] bg-ink text-[13.5px] font-bold text-white transition active:scale-[0.99]"
        >
          {copied ? "Copied" : "Copy the HTML"}
        </button>
        <p className="mt-2 text-[11.5px] leading-[1.45] text-ink-mute">
          In HubSpot: Marketing → Email → new → Design tools → drop in a rich
          text module → source code → paste.
        </p>
      </aside>

      <main className="flex-1 bg-canvas p-5 lg:p-8">
        {/* Pointed at the route rather than fed srcdoc: an iframe loading a
            real document is the closest thing in a browser to how a mail
            client renders one, and the same URL opens in a tab. */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[12px] font-medium text-ink-mute">
            {mode === "preview" ? "Real values" : "HubSpot tokens"} ·{" "}
            {preset.label}
          </p>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="text-[12px] font-bold text-teal"
          >
            Open in a new tab
          </a>
        </div>
        <iframe
          key={src}
          title="Email preview"
          src={src}
          className="h-[calc(100dvh-84px)] w-full rounded-[16px] border border-hairline bg-white"
        />
      </main>
    </div>
  );
}
