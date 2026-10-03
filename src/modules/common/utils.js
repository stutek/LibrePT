// src/modules/common/utils.js
// Shared, general stateless utility helpers for formatting, date conversion, string helpers, time conversions, HTML escaping, and
// scheduling time checks. Used widely by components and the app entry.
//
// Slot parsing and interval collision are NOT here — see domain/timeRange.js. They are training
// vocabulary rather than formatting, and the domain layer cannot import upwards from here.
//
// Record id generation deliberately does NOT live here — see modules/common/recordId.js. It was the
// one helper in this file whose correctness the stored data depends on, and it earned its own module
// when it became UUIDv7.
//
// deps: none

import { sessionCalendarDate } from "../../domain/sessionRecord.js";
import { isTimeOverlapping, parseTimeRange } from "../../domain/timeRange.js";

// Generate initials for avatar text representation
// Initials are rendered into HTML, so they are restricted to letters and digits rather than trusted
// to be short: a name of "<img src=x>" would otherwise emit a raw "<I", which the parser reads as an
// open tag and which swallows the markup after it. Length alone is not safety.
export function getInitials(name) {
  const letters = (s) => (s || "").replace(/[^\p{L}\p{N}]/gu, "");
  if (!name) return "PT";
  const parts = name.trim().split(" ").map(letters).filter(Boolean);
  if (parts.length === 0) return "PT";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Truncate long goal or note text for dashboard previews
export function truncateString(str, num) {
  if (!str) return "";
  if (str.length <= num) return str;
  return `${str.slice(0, num)}...`;
}

/** A date for the screen, as ISO — "2026-07-18". Empty for a missing or unparseable date.
 *
 * ISO because that is the app's own written form of a date, in every language. This
 * function used to build "Jul 18, 2026" from a hardcoded list of English month abbreviations, so the
 * client profile's "Joined" line and every row of the history view read the month in English and the
 * day before the year in US order, whatever language the trainer had chosen. An earlier fix
 * covered the clipboard's past cards and left this one, which covers the other two screens
 * (reported 2026-09-26).
 *
 * The guard for an empty or unparseable date stays HERE rather than moving into `getISODateString`:
 * nineteen call sites pass that one a date they already have, and a guard added there would quietly
 * change what they return.
 */
export function formatDateStr(dateStr) {
  if (!dateStr) return "";
  if (isNaN(new Date(dateStr).getTime())) return "";
  return getISODateString(dateStr);
}

// Format duration from seconds to timer layout (e.g. "59:02"). Minutes are PADDED: this drives live
// countdowns, and a field that changes width as it ticks makes the whole row shift. For a
// non-ticking compact readout see exerciseModality.js's formatCompactDuration ("5:02").
export function formatDuration(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const paddedMins = mins.toString().padStart(2, "0");
  const paddedSecs = secs.toString().padStart(2, "0");

  if (hrs > 0) {
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
}

// Format duration from seconds, prefixing negative sign if overrun
export function formatSignedDuration(totalSeconds) {
  const negative = totalSeconds < 0;
  return (negative ? "-" : "") + formatDuration(Math.abs(totalSeconds));
}

// Whole-minutes duration, HH:MM only (no seconds) — used by session-list-level status lines
// (sessionCard.js: live/upcoming/past), which read at a glance and don't need second precision.
export function formatDurationHM(totalSeconds) {
  const negative = totalSeconds < 0;
  const totalMin = Math.floor(Math.abs(totalSeconds) / 60);
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return `${negative ? "-" : ""}${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

// Countdown/status-line duration in "01h 32m" form — sessionCard.js's live and starts-in timers,
// and sessionBar.js's mirrored dashboard-card chip (the same element). Distinct from
// formatDurationHM: that one is reserved for the past-session elapsed-time field, which is also a
// trainer-editable "HH:MM" input (parseDurationHM's inverse) and must keep that exact shape.
export function formatDurationHourMin(totalSeconds) {
  const negative = totalSeconds < 0;
  const totalMin = Math.floor(Math.abs(totalSeconds) / 60);
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  const sign = negative ? "-" : "";
  // From two days on, days and hours: "870h 01m" for a session a month away had to be divided to be
  // read. Under two days stays hours, so "tomorrow at 09:00" is still counted in hours.
  if (hrs >= 48) {
    const days = Math.floor(hrs / 24);
    return `${sign}${String(days).padStart(2, "0")}d ${String(hrs % 24).padStart(2, "0")}h`;
  }
  return `${sign}${String(hrs).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m`;
}

// Inverse of formatDurationHM, for reading back a trainer-edited "HH:MM" elapsed-time value.
// Returns null (not 0) for unparseable input so a bad edit can be rejected rather than silently
// zeroing the recorded duration.
export function parseDurationHM(text) {
  const m = String(text || "")
    .trim()
    .match(/^(\d+):([0-5]?\d)$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60;
}

// Format 24-hour style clock from minutes (e.g. 840 -> "14:00")
export function formatClockFromMinutes(totalMinutes) {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = ((totalMinutes % 60) + 60) % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// The same clock, from an instant rather than from minutes. THE way this app turns a timestamp into
// a time of day: `toLocaleTimeString` asks the phone, which answers "3:00 PM" on a device set to
// English (US) — in a Slovenian app, beside fields that read 15:00 (AGENT_RULES.md: the format is
// ours, not the device's).
export function formatClockFromEpoch(epochMs) {
  const date = new Date(epochMs);
  return formatClockFromMinutes(date.getHours() * 60 + date.getMinutes());
}

// Escape HTML characters to prevent rendering attacks/unexpected HTML injection.
//
// THE app's escaper — there is deliberately no second one. exerciseAndRestTimer.js carried a
// private copy until it was removed, which is worse than ordinary duplication here: build/
// frontend_audit.py recognises the NAME, so a local copy passes the audit while being free to
// drift from the escaping this one does.
//
// Absent values render as nothing, but a value of 0 is a value: `String(value)` rather than a
// blanket falsy guard, which used to make escapeHTML(0) return "" — a zero silently rendering as
// an empty cell.
export function escapeHTML(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Render formatted client name, appending warning icon if they have injuries. The icon's name comes
// from the caller in the trainer's language (`injuryLabel`); what the injury IS shows on the
// clipboard's banner when that client is picked, and on their profile — never only in a hover.
// The short form a tab shows: the first word of the name, and the surname's initial when another
// client on the same screen (`others`) shares that first word — "Ana K." and "Ana N." rather than
// two tabs both reading "Ana", where a set logged on the wrong one goes to the wrong person. The
// full name when even the initials clash.
function shortClientName(client, others) {
  const words = (name) =>
    String(name || "")
      .trim()
      .split(/\s+/);
  const initialForm = (parts) => `${parts[0]} ${parts[parts.length - 1][0]}.`;
  const own = words(client.name);
  const clashing = others.filter(
    (other) => other && other.id !== client.id && words(other.name)[0] === own[0],
  );
  if (clashing.length === 0 || own.length < 2) return own[0];
  const initials = initialForm(own);
  const stillClashes = clashing.some((other) => {
    const parts = words(other.name);
    return parts.length > 1 && initialForm(parts) === initials;
  });
  return stillClashes ? client.name : initials;
}

// Whether a search finds this client by the name the trainer sees — the name or the alias, because
// the alias is printed beside the name everywhere and is the word that tells two namesakes apart.
// `needle` is already trimmed and lower-cased.
// Compared without accents and case: č/c, š/s, ž/z, ć/c and đ/d are one letter to a search, because most
// phone keyboards need a long press for the accented one and trainers type names without it. Đ has no
// decomposition in Unicode, so it is mapped by hand.
export function foldForSearch(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
}

export function clientNameMatches(client, needle) {
  const folded = foldForSearch(needle);
  return [client?.name, client?.alias].some((part) => foldForSearch(part).includes(folded));
}

// The alias rides along with the name EVERYWHERE the name is rendered, which is the whole point
// of having one: it exists because two clients share a name, so showing it only on the profile
// page would leave every list — the one place the two actually sit side by side — ambiguous.
function withAlias(client, baseName) {
  return client.alias ? `${baseName} (${client.alias})` : baseName;
}

/** A client's name with their alias, as plain text — for `textContent`, a label or a title. */
export function clientDisplayName(client) {
  return client ? withAlias(client, client.name) : "";
}

export function getClientDisplayNameHTML(
  client,
  isShort = false,
  injuryLabel = "Injury recorded",
  others = [],
) {
  if (!client) return "";
  const baseName = isShort ? shortClientName(client, others) : client.name;
  const nameText = withAlias(client, baseName);
  if (client.hasInjury) {
    return `<span class="client-name-with-injury">${escapeHTML(nameText)} <i class="fa-solid fa-triangle-exclamation client-name-injury-mark" role="img" aria-label="${escapeHTML(injuryLabel)}"></i></span>`;
  }
  return escapeHTML(nameText);
}

// The day two sessions are compared on: the calendar date where both have one. The bucket alone
// ("upcoming") is every day from the day after tomorrow on, so it put every future Tuesday and
// Thursday at 18:00 into one clipboard.
function sameDay(a, b) {
  const [dateA, dateB] = [sessionCalendarDate(a), sessionCalendarDate(b)];
  return dateA && dateB ? dateA === dateB : a.day === b.day;
}

// Return list of sessions overlapping with target session
export function getOverlappingSessions(session, sessions) {
  const targetRange = parseTimeRange(session.time);
  return sessions.filter((s) => {
    if (!sameDay(s, session)) return false;
    return isTimeOverlapping(targetRange, parseTimeRange(s.time));
  });
}

// Aggregate participant details, scheduled range, and location for active/idle bar
export function buildSessionMeta(sessions, day, getSessionDayDate) {
  const titles = [...new Set(sessions.map((s) => s.title))];
  const locations = [...new Set(sessions.map((s) => s.location).filter(Boolean))];
  const ranges = sessions.map((s) => parseTimeRange(s.time)).filter(Boolean);
  const startMin = Math.min(...ranges.map((r) => r.start));
  const endMin = Math.max(...ranges.map((r) => r.end));
  // The session's own date where it has one; the bucket cannot say which day "upcoming" is.
  const dated = sessions.find((s) => s.startDate);
  const dayDate = dated ? new Date(dated.startDate) : getSessionDayDate(day);
  dayDate.setHours(0, 0, 0, 0);
  const startDate = new Date(dayDate);
  startDate.setMinutes(startDate.getMinutes() + startMin);
  const endDate = new Date(dayDate);
  endDate.setMinutes(endDate.getMinutes() + endMin);
  // `endDate` is the SCHEDULED end and nothing else. A slot that has already passed used to be
  // rewritten here to `now + 2h`, to keep a countdown alive for a session launched late — but a
  // fabricated end is not a schedule, and everything downstream reads it as one:
  // `proposeAdjustedSchedule` derives the session's planned LENGTH from it, so a 16:00-18:00 slot
  // opened at 21:40 proposed a seven-hour-forty session, and `confirmEarlyFinish` believed two
  // hours were still owed on a session whose slot ended hours ago.
  // Nothing needs the lie any more: sessionClock.js's `computeActiveSessionCountdown` already
  // decides that a session begun after its scheduled end has no countdown left and reports honest
  // elapsed time instead. That is the one place that judgement belongs.

  return {
    id: sessions.length > 0 ? sessions[0].id : null,
    ids: sessions.map((s) => s.id),
    titles,
    // Session id to its title, so a client's session id (`clientSessions`) resolves to a title line.
    sessionTitles: Object.fromEntries(sessions.map((s) => [s.id, s.title])),
    day,
    startDate,
    endDate,
    location: locations.join(" / "),
    timeLabel: `${formatClockFromMinutes(startMin)} - ${formatClockFromMinutes(endMin)}`,
  };
}

/** The colour slot (0-3) of the session a client belongs to on a merged clipboard, or null when
 * there is nothing to pair: one title, or a record that predates `clientSessions`. The title bar
 * numbers its lines the same way, by position in `titles`. */
export const SESSION_DOT_SLOTS = 4;
export function sessionSlotOfTitle(sourceSession, title) {
  const titles = sourceSession?.titles || [];
  const index = titles.indexOf(title);
  return titles.length < 2 || index < 0 ? null : index % SESSION_DOT_SLOTS;
}
export function sessionTitleOfClient(sourceSession, clientId) {
  return sourceSession?.sessionTitles?.[sourceSession?.clientSessions?.[clientId]] ?? null;
}

export function getISODateString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getISODateForColumn(day) {
  const now = Date.now();
  if (day === "yesterday") return getISODateString(now - 24 * 60 * 60 * 1000);
  if (day === "today") return getISODateString(now);
  if (day === "tomorrow") return getISODateString(now + 24 * 60 * 60 * 1000);
  if (day === "upcoming") return getISODateString(now + 2 * 24 * 60 * 60 * 1000);
  return getISODateString(now);
}
