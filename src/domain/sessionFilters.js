// src/domain/sessionFilters.js — what the board is filtered to, and what one tap on a day does to it
// (TODO §45.6).
//
// Single responsibility: the RULES. No DOM, no storage, no rendering — a filter is four strings and
// a function that narrows a list, so both can be read and tested without a browser.
//
// **The date model is `{ from, to }` and nothing else.** A single day is `from === to`; no date
// filter at all is two empty strings. There is no third "mode" field, because a mode is a thing that
// can disagree with what is on screen.
//
// **The click rule follows documented practice rather than our own invention** (§45.6, checked
// 2026-09-11 against eBay's design system, Syncfusion's component and Airbnb's react-dates): first
// tap sets the start, second sets the end, and a tap once a RANGE exists starts over from that day —
// the one behaviour somebody arrives already knowing. A tap on a day earlier than the start makes a
// range in the right order, never an inverted one. Two models we had argued for are deliberately not
// here: alternating odd/even taps, and "the nearer end moves". Neither exists in any system a trainer
// has used, and both put the next tap's meaning in something invisible.
//
// **Arming is the one way to move a single end**, and it is passed in rather than stored here: the
// caller knows whether the `od` or `do` chip is lit, because that is what the person can see.

/** Nothing filtered. The shape every caller starts from, so "empty" is never spelled twice. */
export const NO_SESSION_FILTERS = Object.freeze({
  from: "",
  to: "",
  clientId: "",
  location: "",
});

/** ISO dates sort as strings, which is the whole reason this app stores days as `YYYY-MM-DD`. */
function ordered(a, b) {
  return a <= b ? { from: a, to: b } : { from: b, to: a };
}

export function hasDateFilter({ from, to } = {}) {
  return Boolean(from && to);
}

export function isSingleDay({ from, to } = {}) {
  return Boolean(from) && from === to;
}

export function hasAnyFilter(filters = {}) {
  return hasDateFilter(filters) || Boolean(filters.clientId) || Boolean(filters.location);
}

/**
 * What a tap on `day` makes of the current date filter.
 *
 * `armedEnd` is "from", "to", or null — the chip the trainer lit before tapping, if any. With one
 * armed, only that end moves and the result is re-ordered if it crossed the other; with none, the
 * three-step rule above applies.
 */
export function nextDateSelection(current, day, armedEnd = null) {
  const { from, to } = { from: current?.from || "", to: current?.to || "" };

  if (armedEnd === "from") return ordered(day, to || day);
  if (armedEnd === "to") return ordered(from || day, day);

  // Nothing chosen yet, or a range already stands: either way this day is the new start, alone.
  // Starting over is what makes a third tap predictable — the alternative, extending or nudging an
  // existing range, is where every invented model we tried became unreadable.
  if (!from || !isSingleDay({ from, to })) return { from: day, to: day };

  // One day stands. The same day again means "I am done filtering by date"; another day makes the
  // range between them.
  if (day === from) return { from: "", to: "" };
  return ordered(from, day);
}

/** Every session whose day, participants and location pass. `dateOf` is injected because "which day
 *  is this session on" belongs to the board, not to the rules. */
export function filterSessions(sessions, filters, { dateOf }) {
  const { from, to, clientId, location } = filters || {};
  return (sessions || []).filter((session) => {
    if (from && to) {
      const day = dateOf(session);
      if (day < from || day > to) return false;
    }
    if (clientId && !(session.participants || []).includes(clientId)) return false;
    if (location && (session.location || "") !== location) return false;
    return true;
  });
}

/** The locations actually on the board, so the control can never offer one that matches nothing.
 *  Sorted for a stable list; a session with no location contributes nothing rather than an empty
 *  row that would read as a place called "". */
export function locationsOf(sessions) {
  const seen = new Set();
  for (const session of sessions || []) {
    const location = (session.location || "").trim();
    if (location) seen.add(location);
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

/** The clients who appear on the board, as `{ id, name }`, in the order the client list holds them.
 *  Same rule as locations: a filter that can select nothing is a filter that wastes a tap. */
export function participantsOf(sessions, clients) {
  const onBoard = new Set();
  for (const session of sessions || []) {
    for (const id of session.participants || []) onBoard.add(id);
  }
  return (clients || [])
    .filter((client) => onBoard.has(client.id))
    .map((client) => ({ id: client.id, name: client.name }));
}
