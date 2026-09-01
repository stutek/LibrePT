// src/modules/session/sessionTitleBar.js
// Renders the header / title block of the Active Session Overlay: which session, then when and where.
//
// **Two lines, because one could not say which session this is** (TODO §39.6). It used to be a
// single 22px line reading `2026-09-01 11:30 playground outside` — no session name anywhere in the
// clipboard, and on a desktop window that line still lost 90px to an ellipsis (reported 2026-08-31:
// "this one clips on desktop"). The bar's height is set by the 44px touch row its buttons need,
// while the title was using 25px of it, so a 15px line over a 12px line costs nothing at all:
// measured at 390 and 375, the bar stays the same height and the actions keep their full width.
//
// The order is what survives truncation. The session's NAME is what says which screen you are on,
// so it leads and gets the larger type; the day, the time and the gym follow on a smaller line, in
// that order, so the gym — the least identifying thing on the bar, and usually the same every day —
// is the first thing to be cut.
//
// Built with createElement and textContent rather than innerHTML: a session's name and its location
// are the trainer's own text, and this is a rendering module, not a place to introduce a sink.
//
// deps: {
//   getActiveSession(),
//   getISODateString(date),
//   formatClockFromMinutes(minutes),
//   t(key)                            — for the day label ("today" / "tomorrow")
// }

let deps = null;

export function initSessionTitleBar(d) {
  deps = d;
}

/** The line under the name: when it happens, and where. Empty parts drop out rather than leaving
 * separators behind — a planning programme has no day and no gym. */
function whenAndWhere(sourceSession, activeSession) {
  const start = new Date(
    sourceSession?.startDate ? sourceSession.startDate : activeSession.startTime,
  );
  // The DAY as a person says it where the app has one ("today", "tomorrow"); the date otherwise,
  // which is what a session further out has. A trainer standing in the gym reads the first and
  // never needs the second.
  const day = sourceSession?.day
    ? deps.t?.(sourceSession.day) || sourceSession.day
    : deps.getISODateString(start);
  const time =
    sourceSession?.timeLabel ||
    deps.formatClockFromMinutes(start.getHours() * 60 + start.getMinutes());
  return [day, time, sourceSession?.location].filter(Boolean).join(" · ");
}

export function renderSessionTitle() {
  const el = document.getElementById("session-title-text");
  if (!el) return;
  const activeSession = deps.getActiveSession();
  if (!activeSession) return;

  const sourceSession = activeSession.sourceSession;
  // EVERY title, joined the way the collapsed clipboard bar joins them (sessionBar.js): one
  // clipboard can cover several booked slots, because `buildSessionMeta` collapses overlapping
  // ones, so `titles` is an array. Reading `[0]` made two merged sessions look like one, named
  // after whichever sorted first (raised 2026-08-31).
  const name = sourceSession?.titles?.join(" + ") || deps.t?.("untitled_session") || "";
  // A planning programme is not on any day and is in no gym: its own line is the slot it is being
  // built against, and nothing else.
  const under = sourceSession?.isPlanning
    ? sourceSession.timeLabel || ""
    : whenAndWhere(sourceSession, activeSession);

  const block = document.createElement("span");
  block.className = "clipboard-title";

  const nameEl = document.createElement("span");
  nameEl.className = "clipboard-title-name";
  nameEl.textContent = name;
  block.appendChild(nameEl);

  if (under) {
    const underEl = document.createElement("span");
    underEl.className = "clipboard-title-when";
    underEl.textContent = under;
    block.appendChild(underEl);
  }

  el.replaceChildren(block);
}
