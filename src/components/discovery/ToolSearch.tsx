"use client";

import { useMemo, useState } from "react";
import { ALL_TOOLS, NONE_OPTION } from "@/lib/tech-stack";

/**
 * The stack picker, as a search rather than a grid of chips.
 *
 * The booth version shows nine common tools because an attendee answering for
 * themselves wants to tap, not type. A rep on a call has the opposite problem:
 * the prospect says a name, and if it is not one of the nine the rep has to
 * decide whether it matters enough to add. So this one is the full list,
 * searchable, with free text for anything we have never heard of. What comes
 * back from the field is how the list grows.
 */
export function ToolSearch({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [q, setQ] = useState("");

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return ALL_TOOLS.filter(
      (t) =>
        t.name.toLowerCase().includes(needle) && !selected.includes(t.name),
    ).slice(0, 7);
  }, [q, selected]);

  const exact = ALL_TOOLS.some(
    (t) => t.name.toLowerCase() === q.trim().toLowerCase(),
  );

  const add = (name: string) => {
    const clean = name.trim().slice(0, 60);
    if (!clean || selected.includes(clean)) return;
    onChange([...selected, clean]);
    setQ("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {selected.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(selected.filter((s) => s !== name))}
            className="group flex items-center gap-1.5 rounded-full border border-blue bg-blue px-2.5 py-1 text-[11.5px] font-semibold text-white"
          >
            {name}
            <span className="text-white/60 group-hover:text-white">&times;</span>
          </button>
        ))}
        {selected.length === 0 ? (
          <span className="text-[11.5px] text-ink-pale">Nothing yet</span>
        ) : null}
      </div>

      <div className="relative mt-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(matches[0]?.name ?? q);
            }
          }}
          placeholder="Search or type anything"
          className="h-[36px] w-full rounded-[10px] border border-hairline bg-white px-2.5 text-[13px] font-medium text-ink outline-none placeholder:text-ink-pale focus:border-teal"
        />
        {q.trim() ? (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[10px] border border-hairline bg-white shadow-lg">
            {matches.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => add(t.name)}
                className="block w-full px-3 py-2 text-left text-[13px] font-medium text-ink hover:bg-canvas"
              >
                {t.name}
                <span className="ml-2 text-[11px] uppercase tracking-[0.04em] text-ink-pale">
                  {t.kind}
                </span>
              </button>
            ))}
            {!exact ? (
              <button
                type="button"
                onClick={() => add(q)}
                className="block w-full border-t border-hairline px-3 py-2 text-left text-[13px] font-semibold text-teal hover:bg-canvas"
              >
                Add &ldquo;{q.trim()}&rdquo;
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => add(NONE_OPTION)}
        className="mt-1.5 text-[11.5px] font-semibold text-ink-sub underline"
      >
        {NONE_OPTION}
      </button>
    </div>
  );
}
