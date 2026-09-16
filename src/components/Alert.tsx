import type { ReactNode } from "react";

/**
 * The tinted callout from the Yosi hub: an (i) in a soft panel.
 *
 * Used here to carry the product point next to the thing it describes: the
 * prospect is doing a patient's intake, and each screen has a sentence about
 * what the patient's version does that theirs cannot show. Kept to one idea
 * and no invented statistics.
 */
export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "warn";
  children: ReactNode;
}) {
  const styles = {
    info: "border-teal/20 bg-teal-bg text-ink",
    success: "border-green/25 bg-green-bg text-ink",
    warn: "border-amber-line bg-amber-bg text-amber-dk",
  }[tone];

  return (
    <div className={`flex gap-2.5 rounded-[14px] border px-3.5 py-3 ${styles}`}>
      <svg
        viewBox="0 0 24 24"
        className="mt-[1px] h-[18px] w-[18px] shrink-0 opacity-70"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M12 11v5.5"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <circle cx="12" cy="7.75" r="1.05" fill="currentColor" />
      </svg>
      <p className="text-[12.5px] font-medium leading-[1.5]">{children}</p>
    </div>
  );
}
