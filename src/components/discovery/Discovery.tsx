"use client";

import { useState } from "react";
import { Readout } from "./Readout";
import { INPUT_DEFAULTS, type CalcInputs } from "@/lib/calc";
import { SATISFACTION } from "@/lib/tech-stack";
import { SERVICES, TIERS } from "@/lib/services";
import { ToolSearch } from "./ToolSearch";

/**
 * The discovery tool. A rep drives it on a call while sharing their screen.
 *
 * Different animal from the booth microsite, in three ways that matter.
 *
 * It is landscape, because it ends up in a deck. It is editable live, because
 * the useful moment on a call is "you said forty five, what happens at sixty"
 * and a rep who has to go back and start again loses the room. And it can
 * carry price, because a human is present to put it in context, which is
 * exactly the thing a public microsite cannot do.
 *
 * The rate is typed, never stored and never committed. Our sheets are
 * negotiated per group rather than list, and this repository is public.
 */
export function Discovery() {
  const [v, setV] = useState<CalcInputs>(INPUT_DEFAULTS);
  const [practice, setPractice] = useState("");
  const [locations, setLocations] = useState(1);
  const [rate, setRate] = useState("");
  const [stack, setStack] = useState<string[]>(["athenahealth"]);
  const [interests, setInterests] = useState<string[]>([]);
  const [concerns, setConcerns] = useState("");
  const [satisfaction, setSatisfaction] = useState<string | null>(null);
  const [onlineBooking, setOnlineBooking] = useState(false);
  const [asksForReviews, setAsksForReviews] = useState(false);
  const [present, setPresent] = useState(false);

  const set = <K extends keyof CalcInputs>(k: K) => (n: number) =>
    setV((p) => ({ ...p, [k]: n }));

  const rateNumber = rate.trim() === "" ? null : Number(rate);

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto w-full max-w-[1500px] px-6 py-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-teal">
              Yosi · Internal
            </p>
            <h1 className="mt-1 text-[26px] font-extrabold leading-none tracking-[-0.025em] text-ink">
              Discovery readout
            </h1>
            <p className="mt-2 max-w-[680px] text-[13px] leading-[1.55] text-ink-sub">
              For a call, not for a prospect to find. Fill it in while they
              talk, share your screen when you get to the number, screenshot it
              for the follow-up. Nothing here is saved.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPresent((p) => !p)}
            className={`min-h-[44px] rounded-[14px] px-5 text-[14px] font-bold transition ${
              present
                ? "bg-ink text-white"
                : "border border-hairline bg-white text-ink"
            }`}
          >
            {present ? "Show the controls" : "Hide the controls"}
          </button>
        </header>

        <div
          className={`mt-5 grid gap-6 ${present ? "" : "lg:grid-cols-[320px_1fr]"}`}
        >
          {present ? null : (
            <aside className="rounded-[18px] border border-hairline bg-white p-5">
              <Field
                label="Practice"
                value={practice}
                onChange={setPractice}
                placeholder="Lakeview Women's Health"
              />

              <div className="mt-5 space-y-4">
                <Num label="Providers" value={v.providers} onChange={set("providers")} min={1} max={60} />
                <Num label="Locations" value={locations} onChange={setLocations} min={1} max={40} />
                <Num label="Patients a day" value={v.patientsPerDay} onChange={set("patientsPerDay")} min={1} max={400} />
                <Num
                  label="No-show rate %"
                  value={Math.round(v.noShowRate * 100)}
                  onChange={(n) => set("noShowRate")(n / 100)}
                  min={0}
                  max={60}
                />
                <Num label="Front desk headcount" value={v.frontDeskStaff} onChange={set("frontDeskStaff")} min={1} max={60} />
                <Num
                  label="Collected up front %"
                  value={Math.round(v.collectedRate * 100)}
                  onChange={(n) => set("collectedRate")(n / 100)}
                  min={0}
                  max={100}
                />
                <Num label="New patients a month" value={v.newPatientsPerMonth} onChange={set("newPatientsPerMonth")} min={0} max={400} />
              </div>

              <div className="mt-5 border-t border-hairline pt-4">
                <Label>What they run</Label>
                <div className="mt-2">
                  <ToolSearch selected={stack} onChange={setStack} />
                </div>

                {/* Only once there is something to have an opinion about.
                    Asking how it is working out before they have named
                    anything is a question with no subject. */}
                {stack.length > 0 ? (
                  <>
                    <Label className="mt-4">How it&apos;s working out</Label>
                    <select
                      value={satisfaction ?? ""}
                      onChange={(e) => setSatisfaction(e.target.value || null)}
                      className="mt-1.5 h-[40px] w-full rounded-[10px] border border-hairline bg-white px-2.5 text-[13px] font-medium text-ink"
                    >
                      <option value="">Not asked</option>
                      {SATISFACTION.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </>
                ) : null}

                <div className="mt-3 space-y-1.5">
                  <Toggle label="Books online" on={onlineBooking} onClick={() => setOnlineBooking((p) => !p)} />
                  <Toggle label="Asks for reviews" on={asksForReviews} onClick={() => setAsksForReviews((p) => !p)} />
                </div>
              </div>

              <div className="mt-5 border-t border-hairline pt-4">
                <Label>What they are interested in</Label>
                <div className="mt-2 space-y-2.5">
                  {TIERS.map((tier) => (
                    <div key={tier}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-ink-pale">
                        {tier}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {SERVICES.filter((sv) => sv.tier === tier).map((sv) => {
                          const on = interests.includes(sv.id);
                          return (
                            <button
                              key={sv.id}
                              type="button"
                              onClick={() =>
                                setInterests((p) =>
                                  on ? p.filter((x) => x !== sv.id) : [...p, sv.id],
                                )
                              }
                              className={`rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition ${
                                on
                                  ? "border-teal bg-teal text-white"
                                  : "border-hairline bg-white text-ink-sub"
                              }`}
                            >
                              {sv.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <Label className="mt-4">Anything else on their mind</Label>
                <textarea
                  value={concerns}
                  onChange={(e) => setConcerns(e.target.value.slice(0, 220))}
                  rows={3}
                  placeholder="Their words, not yours. Goes on the slide."
                  className="mt-1.5 w-full resize-none rounded-[10px] border border-hairline bg-white px-2.5 py-2 text-[13px] font-medium leading-[1.45] text-ink outline-none placeholder:text-ink-pale focus:border-teal"
                />
              </div>

              <div className="mt-5 border-t border-hairline pt-4">
                <Field
                  label="Their rate, $ per provider per month"
                  value={rate}
                  onChange={setRate}
                  placeholder="Leave blank to omit"
                  numeric
                />
                <p className="mt-1.5 text-[11.5px] leading-[1.45] text-ink-mute">
                  Typed, not stored. Our sheets are negotiated per group and
                  this repo is public, so no rate card lives in it. Blank hides
                  the return and payback line.
                </p>
              </div>
            </aside>
          )}

          <main>
            <div className="overflow-hidden rounded-[18px] border border-hairline shadow-[0_18px_40px_-16px_rgba(15,23,42,0.18)]">
              <Readout
                inputs={v}
                practice={practice.trim() || "This practice"}
                locations={locations}
                interests={interests}
                concerns={concerns}
                monthlyRate={
                  rateNumber !== null && Number.isFinite(rateNumber) && rateNumber > 0
                    ? rateNumber
                    : null
                }
                techStack={stack}
                intakeSatisfaction={satisfaction}
                onlineBooking={onlineBooking}
                asksForReviews={asksForReviews}
              />
            </div>
            <p className="mt-3 text-[12px] text-ink-mute">
              16:9, so a screenshot drops straight onto a slide. Hide the
              controls first and grab just the card.
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}

function Label({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`block text-[10px] font-bold uppercase tracking-[0.06em] text-ink-mute ${className}`}
    >
      {children}
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  numeric,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  numeric?: boolean;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={numeric ? "numeric" : undefined}
        className="mt-1.5 h-[40px] w-full rounded-[10px] border border-hairline bg-white px-2.5 text-[14px] font-medium text-ink outline-none placeholder:text-ink-pale focus:border-teal"
      />
    </label>
  );
}

function Num({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <Label>{label}</Label>
        <span className="text-[15px] font-extrabold tabular-nums text-ink">
          {value}
        </span>
      </span>
      {/* A range and a box together: the slider is for talking through "what
          if", the box is for typing the figure they just read off a report. */}
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-6 flex-1 cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-hairline
            [&::-webkit-slider-thumb]:-mt-[7px] [&::-webkit-slider-thumb]:h-[15px] [&::-webkit-slider-thumb]:w-[15px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal"
        />
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-[32px] w-[62px] rounded-[8px] border border-hairline bg-white px-2 text-[13px] font-semibold tabular-nums text-ink outline-none focus:border-teal"
        />
      </div>
    </label>
  );
}

function Toggle({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex w-full items-center justify-between rounded-[10px] border px-3 py-2 text-[12.5px] font-semibold transition ${
        on ? "border-blue bg-blue text-white" : "border-hairline bg-white text-ink"
      }`}
    >
      {label}
      <span className={on ? "text-white/70" : "text-ink-pale"}>
        {on ? "Yes" : "No"}
      </span>
    </button>
  );
}
