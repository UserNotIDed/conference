"use client";

import { useState } from "react";
import type { Row } from "@/lib/rows";
import {
  FORMS,
  PORTAL_ID,
  PROPERTIES,
  contactProperties,
  formPayload,
  submitUrl,
  type PropertyDef,
} from "@/lib/hubspot";

/**
 * /admin, as HubSpot sees it.
 *
 * Two questions this answers and the session table cannot. First: what has to
 * exist in HubSpot before the show — the property spec, with the internal names
 * that are the actual contract. Second: for any given lead, what exactly gets
 * POSTed — not a rendering of our own row shape, but the payload itself, built
 * by the same function the submit uses.
 *
 * That second part matters more than it sounds. Every integration like this
 * fails the same way: a property renamed on one side, a key still spelling the
 * old name on the other, and a column quietly empty on every lead for two days
 * until someone opens a contact and notices.
 */

function TypeChip({ p }: { p: PropertyDef }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] ${
        p.standard ? "bg-canvas text-ink-mute" : "bg-teal-bg text-teal"
      }`}
    >
      {p.standard ? "standard" : p.type}
    </span>
  );
}

export function HubSpotView({ rows }: { rows: Row[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const toCreate = PROPERTIES.filter((p) => !p.standard);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } catch {
      window.prompt("Copy", text);
    }
  };

  const withLead = rows.filter((r) => r.captureEmail);

  return (
    <div className="space-y-6">
      {/* ---- The wiring, in one box, so nobody has to read the code. ---- */}
      <section className="rounded-[16px] border border-hairline bg-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-mute">
          How it connects
        </p>
        <p className="mt-1.5 text-[13px] leading-[1.6] text-ink-sub">
          The microsite POSTs server-side to the HubSpot Forms API. No SDK, no
          OAuth, no private app token — the endpoint is public by design and the
          form GUID is the credential. HubSpot dedupes on email, so one person
          submitting twice updates one contact. A submission can start a
          workflow, which is how the follow-up email goes out without us sending
          mail.
        </p>
        <dl className="mt-3 space-y-2">
          <Wire label="Portal" value={PORTAL_ID} />
          <Wire
            label="Form 1 — lead captured"
            value={FORMS.lead || "HUBSPOT_FORM_LEAD not set"}
            note="Fires when section 1 is answered. The lead, even if they walk off."
            missing={!FORMS.lead}
          />
          <Wire
            label="Form 2 — diagnosis"
            value={FORMS.diagnosis || "HUBSPOT_FORM_DIAGNOSIS not set"}
            note="Fires when the score and the money land. This is the one the email workflow listens to."
            missing={!FORMS.diagnosis}
          />
          <Wire
            label="Endpoint"
            value={submitUrl(FORMS.diagnosis || "{formGuid}")}
          />
        </dl>
      </section>

      {/* ---- The spec. ---- */}
      <section className="rounded-[16px] border border-hairline bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-mute">
              Properties to create
            </p>
            <p className="mt-1.5 text-[13px] text-ink-sub">
              {toCreate.length} to add on the Contact object, plus{" "}
              {PROPERTIES.length - toCreate.length} that already exist. The
              internal name is the contract — renaming one in HubSpot breaks the
              submit silently.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              copy(
                toCreate
                  .map(
                    (p) =>
                      `${p.name}\t${p.label}\t${p.type}${p.options ? `\t${p.options.join(" | ")}` : ""}`,
                  )
                  .join("\n"),
                "spec",
              )
            }
            className="min-h-[40px] shrink-0 rounded-[12px] border border-hairline px-4 text-[13px] font-bold text-ink"
          >
            {copied === "spec" ? "Copied" : "Copy the spec"}
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-hairline">
                <Th>Internal name</Th>
                <Th>Label</Th>
                <Th>Type</Th>
                <Th>Form</Th>
                <Th>Why</Th>
              </tr>
            </thead>
            <tbody>
              {PROPERTIES.map((p) => (
                <tr key={p.name} className="border-b border-hairline/70 align-top">
                  <td className="py-2.5 pr-3">
                    <code
                      className={`rounded px-1.5 py-0.5 text-[12px] font-semibold ${
                        p.standard ? "bg-canvas text-ink-mute" : "bg-teal-bg text-ink"
                      }`}
                    >
                      {p.name}
                    </code>
                  </td>
                  <td className="py-2.5 pr-3 text-[12.5px] text-ink-sub">{p.label}</td>
                  <td className="py-2.5 pr-3">
                    <TypeChip p={p} />
                    {p.options ? (
                      <p className="mt-1 text-[11px] leading-[1.4] text-ink-mute">
                        {p.options.join(" · ")}
                      </p>
                    ) : null}
                  </td>
                  <td className="py-2.5 pr-3 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-ink-mute">
                    {p.form}
                  </td>
                  <td className="py-2.5 text-[11.5px] leading-[1.45] text-ink-mute">
                    {p.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- The payloads. ---- */}
      <section className="rounded-[16px] border border-hairline bg-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-mute">
          What each lead sends
        </p>
        <p className="mt-1.5 text-[13px] text-ink-sub">
          Built by the same function the submit uses, so this is the payload, not
          a picture of it. {withLead.length} of {rows.length} sessions have an
          email and would submit.
        </p>

        {withLead.length === 0 ? (
          <p className="mt-4 rounded-[12px] border border-dashed border-hairline px-4 py-6 text-center text-[13px] text-ink-mute">
            No leads yet. Run the flow at <code>/preview</code> or start a session
            by hand.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {withLead.map((row) => {
              const props = contactProperties(row, "all");
              const isOpen = open === row.token;
              return (
                <div
                  key={row.token}
                  className="overflow-hidden rounded-[12px] border border-hairline"
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : row.token)}
                    className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-canvas"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold text-ink">
                        {props.email ?? "—"}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-ink-mute">
                        {props.company ?? "no practice"} ·{" "}
                        {Object.keys(props).length} fields
                        {props.booth_health_score
                          ? ` · score ${props.booth_health_score}`
                          : " · no diagnosis yet"}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] font-bold text-teal">
                      {isOpen ? "Hide" : "Payload"}
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="border-t border-hairline bg-canvas px-3.5 py-3">
                      <div className="flex flex-wrap gap-2">
                        {(["lead", "diagnosis"] as const).map((which) => (
                          <button
                            key={which}
                            type="button"
                            onClick={() =>
                              copy(
                                JSON.stringify(formPayload(row, which), null, 2),
                                `${row.token}-${which}`,
                              )
                            }
                            className="min-h-[36px] rounded-[10px] border border-hairline bg-white px-3 text-[12px] font-bold text-ink"
                          >
                            {copied === `${row.token}-${which}`
                              ? "Copied"
                              : `Copy ${which} payload`}
                          </button>
                        ))}
                      </div>
                      <dl className="mt-3 divide-y divide-hairline">
                        {PROPERTIES.map((p) => (
                          <div
                            key={p.name}
                            className="flex items-baseline justify-between gap-4 py-1.5"
                          >
                            <dt className="shrink-0">
                              <code className="text-[11.5px] font-semibold text-ink-sub">
                                {p.name}
                              </code>
                            </dt>
                            <dd
                              className={`min-w-0 break-words text-right text-[12.5px] font-medium ${
                                props[p.name] === undefined
                                  ? "text-ink-pale"
                                  : "text-ink"
                              }`}
                            >
                              {props[p.name] ?? "— not sent"}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Wire({
  label,
  value,
  note,
  missing,
}: {
  label: string;
  value: string;
  note?: string;
  missing?: boolean;
}) {
  return (
    <div className="rounded-[12px] border border-hairline bg-canvas px-3 py-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <dt className="text-[11px] font-bold uppercase tracking-[0.05em] text-ink-mute">
          {label}
        </dt>
        <dd
          className={`break-all text-[12.5px] font-semibold ${
            missing ? "text-amber-dk" : "text-ink"
          }`}
        >
          {value}
        </dd>
      </div>
      {note ? (
        <p className="mt-1 text-[11.5px] leading-[1.45] text-ink-mute">{note}</p>
      ) : null}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="pb-2 pr-3 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-mute">
      {children}
    </th>
  );
}
