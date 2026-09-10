// src/data/sandboxStaleness.js — has the sandbox gone flat, and may the trainer be asked about it?
// (TODO §40.4). Pure: takes the sandbox's own bookkeeping and a clock reading, returns a decision.
// No storage, no DOM, no `Date.now()` of its own.
//
// **Why it goes flat at all.** The seed generates its sessions relative to "now"
// ([data/sessions.js](sessions.js), [data/sessionSeriesSeed.js](sessionSeriesSeed.js)) so the demo
// dashboard always opens on a live and an upcoming session. That is the whole demonstration, and by
// the next morning it is behind the trainer instead of in front of them.
//
// **Twelve hours, not the week the seed spans.** The edges of the seeded week age slowly; today's
// board does not. A trainer who opens the sandbox in the morning and again the next day is asked,
// which is the intent.
//
// **A declined offer is not repeated for three hours.** The offer destroys what the trainer did in
// the sandbox, so "no" has to mean no for long enough to get on with something — but not forever,
// because the board they said no to is the one that is empty.
//
// **An unknown seeding time is NOT stale.** A sandbox whose meta predates this bookkeeping, or was
// lost, tells us nothing about its age — and offering to delete somebody's work on no evidence is
// the expensive way to be wrong. It goes stale from the first time this build stamps it.
//
// Injected dependencies: none.

export const STALE_AFTER_MS = 12 * 60 * 60 * 1000;
export const OFFER_COOLDOWN_MS = 3 * 60 * 60 * 1000;

/**
 * `{ stale, ask, ageMs }` for a sandbox seeded at `meta.seededAt`, whose reseed offer was last
 * declined at `meta.staleOfferDeclinedAt`.
 *
 * `stale` is a fact about the data; `ask` is whether to put it in front of the trainer now. They are
 * separate so a caller can say "your sandbox is from yesterday" without also re-opening a question
 * that was answered an hour ago.
 */
export function sandboxStaleness(meta, now = Date.now()) {
  const seededAt = Number(meta?.seededAt);
  if (!Number.isFinite(seededAt)) return { stale: false, ask: false, ageMs: null };

  // A clock moved backwards (travel, a corrected device) reads as a negative age. Clamped rather
  // than trusted: the alternative is an offer to wipe the sandbox because the phone changed zone.
  const ageMs = Math.max(0, now - seededAt);
  const stale = ageMs >= STALE_AFTER_MS;
  if (!stale) return { stale: false, ask: false, ageMs };

  const declinedAt = Number(meta?.staleOfferDeclinedAt);
  if (!Number.isFinite(declinedAt)) return { stale: true, ask: true, ageMs };

  const sinceDeclined = Math.max(0, now - declinedAt);
  return { stale: true, ask: sinceDeclined >= OFFER_COOLDOWN_MS, ageMs };
}
