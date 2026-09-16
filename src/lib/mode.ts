/**
 * Standalone: the flow, with nothing behind it.
 *
 * No database, no writes, no lead record. Set `BOOTH_STANDALONE=1` and the
 * microsite serves the experience and forgets it the moment the tab closes.
 *
 * It exists for the sales walkthrough. The team needs to feel the thing on
 * their own phones a fortnight before the show, and a dozen rehearsal runs from
 * the sales team is exactly the data you do not want sitting in the lead export
 * on day one. It also means the deploy needs no database, no Turso and no
 * secrets, so it can go up now rather than after someone provisions something.
 *
 * Explicit env var rather than inferring it from a missing DATABASE_URL: an
 * env var that fails to load should break loudly, not silently stop saving
 * leads at a show.
 */
export const STANDALONE = process.env.BOOTH_STANDALONE === "1";

/** Shown wherever a lead-data screen would be, so nobody thinks it is broken. */
export const STANDALONE_NOTICE =
  "This deployment is the walkthrough only. Nothing is saved, so there are no leads to show.";
