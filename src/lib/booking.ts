/**
 * Where "Book a demo" goes.
 *
 * An env var so swapping the scheduler is a redeploy rather than a rebuild,
 * and one constant so the screen, the follow-up email and the outbound link
 * cannot drift onto different URLs.
 *
 * This file is what is left of prospect-content.ts, which held the copy for
 * the patient-roleplay flow. That flow is gone and its words went with it.
 */
export const BOOKING_URL =
  process.env.NEXT_PUBLIC_BOOKING_URL ?? "https://yosi.health";
