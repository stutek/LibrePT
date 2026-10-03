// src/data/calendarDay.js — the trainer's calendar day, as `YYYY-MM-DD`.
//
// A calendar day is read with the device's LOCAL getters, never cut out of `toISOString()`, which
// is UTC. East of UTC, between local midnight and the UTC rollover, the UTC date is yesterday: at
// 00:38 in Ljubljana the new-session form offered the day before, and consent, a client's joining
// date and an erasure request were dated a day early. The same mistake had been fixed three times,
// each with a helper of its own; this is the one helper, and tests/unit/test_calendar_day.py fails
// the build on a date cut out of `toISOString()` anywhere in src/.
//
// It lives in data/, the lowest layer, so every layer can import it.

/** The local calendar day of an ISO instant (`2026-10-02T23:30:00.000Z`), or "" when it is empty or
 * not a time. Cutting the first ten characters out of the instant gives the UTC day instead. */
export function localDayOfInstant(instant) {
  if (typeof instant !== "string" || instant === "") return "";
  return Number.isNaN(new Date(instant).getTime()) ? "" : localDateString(instant);
}

/** The local calendar day of `date' (a Date, or anything `new Date` reads), as `YYYY-MM-DD`. */
export function localDateString(date = new Date()) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}
