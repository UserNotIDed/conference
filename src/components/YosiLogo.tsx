/* eslint-disable @next/next/no-img-element */

/**
 * The Yosi wordmark.
 *
 * The real asset, pulled from yosi.health. Served from /yosi-logo.svg so
 * replacing it stays a file drop with no code change. Its intrinsic ratio is
 * roughly 3:1, so callers set a height and the width follows.
 */
export function YosiLogo({ className = "h-7" }: { className?: string }) {
  return (
    <img src="/yosi-logo.svg" alt="Yosi health" className={`w-auto ${className}`} />
  );
}
