// helper/utils.js
// General stateless utility helpers for formatting, uuid generation, time conversions, HTML escaping,
// and scheduling time checks. Used widely by components and the app entry.
//
// deps: none

// Helper to generate short UUIDs for all entity types (clients, sessions, exercises, supersets/combos, etc.)
export function generateShortUUID() {
  return Math.random().toString(36).substring(2, 10);
}

// Generate initials for avatar text representation
export function getInitials(name) {
  if (!name) return "PT";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Truncate long goal or note text for dashboard previews
export function truncateString(str, num) {
  if (!str) return "";
  if (str.length <= num) return str;
  return `${str.slice(0, num)}...`;
}

// Format ISO date strings into readable layout strings (e.g. "Jul 18, 2026")
export function formatDateStr(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// Format duration from seconds to timer layout (e.g. "59:02")
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

// Escape HTML characters to prevent rendering attacks/unexpected HTML injection
export function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Render formatted client name, appending warning icon if they have injuries
export function getClientDisplayNameHTML(client, isShort = false) {
  if (!client) return "";
  const nameText = isShort ? client.name.split(" ")[0] : client.name;
  if (client.hasInjury) {
    return `<span class="client-name-with-injury" style="display: inline-flex; align-items: center; gap: 4px;">${escapeHTML(nameText)} <i class="fa-solid fa-triangle-exclamation text-red" style="font-size: 11px; color: #ef4444;" title="Has recorded injury: ${escapeHTML(client.injury || client.notes || "")}"></i></span>`;
  }
  return escapeHTML(nameText);
}

// Parse scheduled AM/PM range to numerical start/end minutes
export function parseTimeRange(timeStr) {
  const parts = timeStr.split("-");
  if (parts.length !== 2) return null;
  const parseTime = (s) => {
    const m = s.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) return 0;
    let hour = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const ampm = m[3] ? m[3].toUpperCase() : null;
    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return hour * 60 + min;
  };
  const start = parseTime(parts[0]);
  let end = parseTime(parts[1]);
  // A range whose end is at or before its start crosses midnight (e.g. "22:00 - 00:00"): treat the
  // end as the next day so overlap and duration maths stay correct. Without this a late-evening
  // session reads as an inverted range and overlaps nothing — not even itself — so its card
  // silently fails to launch (getOverlappingBookings returns []).
  if (end <= start) end += 24 * 60;
  return { start, end };
}

// Check if two time ranges overlap
export function isTimeOverlapping(rangeA, rangeB) {
  if (!rangeA || !rangeB) return false;
  return rangeA.start < rangeB.end && rangeB.start < rangeA.end;
}

// Return list of bookings overlapping with target booking
export function getOverlappingBookings(booking, bookings) {
  const targetRange = parseTimeRange(booking.time);
  return bookings.filter((b) => {
    if (b.day !== booking.day) return false;
    return isTimeOverlapping(targetRange, parseTimeRange(b.time));
  });
}

// Aggregate participant details, scheduled range, and location for active/idle bar
export function buildBookingMeta(bookings, day, getSessionDayDate) {
  const titles = [...new Set(bookings.map((b) => b.title))];
  const locations = [...new Set(bookings.map((b) => b.location).filter(Boolean))];
  const ranges = bookings.map((b) => parseTimeRange(b.time)).filter(Boolean);
  const startMin = Math.min(...ranges.map((r) => r.start));
  const endMin = Math.max(...ranges.map((r) => r.end));
  const dayDate = getSessionDayDate(day);
  const startDate = new Date(dayDate);
  startDate.setMinutes(startDate.getMinutes() + startMin);
  const endDate = new Date(dayDate);
  endDate.setMinutes(endDate.getMinutes() + endMin);

  return {
    id: bookings.length > 0 ? bookings[0].id : null,
    ids: bookings.map((b) => b.id),
    titles,
    day,
    startDate,
    endDate,
    location: locations.join(" / "),
    timeLabel: `${formatClockFromMinutes(startMin)} - ${formatClockFromMinutes(endMin)}`,
  };
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

export function getColumnForISODate(isoDate) {
  if (isoDate === getISODateForColumn("yesterday")) return "yesterday";
  if (isoDate === getISODateForColumn("today")) return "today";
  if (isoDate === getISODateForColumn("tomorrow")) return "tomorrow";
  return "upcoming";
}
