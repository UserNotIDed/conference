"use client";

import { useMemo, useState } from "react";
import { CapLabel, Check } from "@/components/ui";
import { PlusIcon } from "@/components/icons";

/**
 * Pick-many from a grid of common answers, with a disclosure for the long tail
 * and a search for anything not listed.
 *
 * The shape matters: showing nine tappable options beats an empty search box,
 * because most people cannot recall the name of the thing they use until they
 * see it. The search is the escape hatch, not the primary path.
 *
 * One option is exclusive ("none of these") and clears the rest, because an
 * answer that says both "nothing" and "Phreesia" is not an answer.
 */
export function MultiSelectGrid({
  common,
  more,
  selected,
  onChange,
  noneLabel,
  addLabel,
  addPlaceholder,
  addCta,
  showMoreLabel,
  showLessLabel,
}: {
  common: string[];
  more: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  noneLabel: string;
  addLabel: string;
  addPlaceholder: string;
  addCta: string;
  showMoreLabel: (n: number) => string;
  showLessLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const noneOn = selected.includes(noneLabel);

  // Anything they typed that is not one of ours still belongs on screen.
  const custom = useMemo(
    () => selected.filter((s) => s !== noneLabel && ![...common, ...more].includes(s)),
    [selected, common, more, noneLabel],
  );

  const toggle = (name: string) => {
    if (name === noneLabel) {
      onChange(noneOn ? [] : [noneLabel]);
      return;
    }
    const without = selected.filter((s) => s !== noneLabel);
    onChange(
      without.includes(name)
        ? without.filter((s) => s !== name)
        : [...without, name],
    );
  };

  const add = () => {
    const v = query.trim();
    if (!v) return;
    if (!selected.includes(v)) toggle(v);
    setQuery("");
  };

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return [...common, ...more]
      .filter((t) => t.toLowerCase().includes(q) && !selected.includes(t))
      .slice(0, 4);
  }, [query, common, more, selected]);

  const visible = expanded ? [...common, ...more] : common;

  return (
    <div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {[...visible, ...custom].map((name) => (
          <Option
            key={name}
            label={name}
            on={selected.includes(name)}
            onClick={() => toggle(name)}
          />
        ))}
      </div>

      {more.length > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 min-h-[48px] w-full rounded-[14px] border border-hairline bg-white text-[14px] font-semibold text-ink transition active:scale-[0.99]"
        >
          {expanded ? showLessLabel : showMoreLabel(more.length)}
        </button>
      ) : null}

      <div className="mt-6">
        <CapLabel>{addLabel}</CapLabel>
        <div className="mt-2 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder={addPlaceholder}
            className="h-[52px] flex-1 rounded-[14px] border border-hairline bg-white px-[14px] text-[16px] font-medium text-ink outline-none placeholder:text-ink-pale focus:border-teal focus:ring-2 focus:ring-teal/20"
          />
          <button
            type="button"
            onClick={add}
            disabled={query.trim().length === 0}
            className="flex h-[52px] shrink-0 items-center gap-1.5 rounded-[14px] bg-ink px-4 text-[14px] font-bold text-white disabled:opacity-30"
          >
            <PlusIcon className="h-4 w-4" />
            {addCta}
          </button>
        </div>
        {suggestions.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => {
                  toggle(sug);
                  setQuery("");
                }}
                className="rounded-full border border-teal/25 bg-teal-bg px-3 py-1.5 text-[12.5px] font-semibold text-teal"
              >
                {sug}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 border-t border-hairline pt-4">
        <Option label={noneLabel} on={noneOn} onClick={() => toggle(noneLabel)} />
      </div>
    </div>
  );
}

function Option({
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
      className={`flex min-h-[56px] w-full items-center gap-3 rounded-[14px] border px-3.5 py-3 text-left text-[15px] font-semibold transition active:scale-[0.99] ${
        on ? "border-teal bg-teal-bg text-ink" : "border-hairline bg-white text-ink"
      }`}
    >
      <span
        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-2 ${
          on ? "border-teal bg-teal text-white" : "border-hairline"
        }`}
      >
        {on ? <Check className="h-3 w-3" /> : null}
      </span>
      {label}
    </button>
  );
}
