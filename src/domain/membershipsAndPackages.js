// src/domain/membershipsAndPackages.js — which membership or package each session a client attended
// uses, and what is left of each.
//
// Single responsibility: the counting rules of use_cases/uc10_memberships_and_session_packages.md,
// over the PREVIEW records `clientMemberships` and `sessionPackages` (data/recordSchemas.js). No DOM,
// no storage.
//
// **Computed when it is read, never written.** Which package a session used is not stored on the
// attendance row. Store it, and a package whose dates the trainer corrects keeps last month's answer,
// which nobody can then explain. Computed from the records every time, every answer can be checked
// against them, and the same records always give the same answer.
//
// **The order of the rules, for one session of one client**, in the order the sessions started:
//   1. A session that does not use up a session of what the client paid for (`consumesQuota` false on
//      its attendance) is not counted at all.
//   2. Two or more holders of a pair package at the same session use the pair package, one session for
//      all of them, before anything else: that is what they bought it for. Which of them comes first
//      in the list changes nothing.
//   3. A membership of the client's that covers the day: its sessions are lost when the period ends.
//   4. Then the package that ends soonest, then the one bought first. A package that never ends, and
//      one counted from its first session that has not started, come after the running ones.
//   5. Nothing left: the session is not covered, and the trainer charges it singly.
// A membership or package covers a day when the day is inside its validity and inside no pause, the
// kind of session matches, and it has a session left.
//
// **End dates.** A package's validity ends the day before the same date one validity later; when the
// later month has no such date, it ends on that month's last day (bought 31 January, valid a month:
// the last day is 28 February). A pause that says so moves the end by its days, each day counted
// once however the pauses overlap. An end date the trainer set by hand (`validUntil`) is final.
//
// **Days are calendar days, `YYYY-MM-DD`**, and all arithmetic is on the calendar, in UTC, so a
// summer-time change cannot move a day. A week runs Monday to Sunday. A month counted from a start
// date keeps that day of the month and takes the month's last day when it is shorter (31 January,
// 28 February, 31 March).
//
// **The rules trust their input; `packageProblems` and `membershipProblems` check it.** A screen that
// writes these records runs them first: a typo such as a validity count without its unit would
// otherwise read as "never ends".
//
// Injected dependencies: none — pure functions over plain objects. A "use" is one client at one
// session: `{ id, clientId, day, startsAt, sessionId, participants, consumesQuota }`, where
// `participants` is how many were booked (1 is an individual session), `day` is the session's
// calendar day where the trainer is and `startsAt` its start instant. `usesFromAttendance` builds
// them from the stored records.

import { sessionCalendarDate } from "./sessionRecord.js";

const MEMBERSHIPS = "clientMemberships";
const PACKAGES = "sessionPackages";

/**
 * One use per attendance row whose session row still exists: the attendance id, the session's
 * calendar day and start, and how many were booked on it. Whether it counts is the row's own
 * `consumesQuota`, which the trainer decides; neither the attendance status nor the session status is
 * read, so a no-show or a late cancellation the trainer charges counts.
 */
export function usesFromAttendance({ sessionAttendance = [], sessions = [] }) {
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  return sessionAttendance.flatMap((row) => {
    const session = sessionById.get(row.sessionId);
    const day = sessionCalendarDate(session);
    if (!day) return [];
    return [
      {
        id: row.id,
        clientId: row.clientId,
        sessionId: row.sessionId,
        day,
        startsAt: session.startDate,
        participants: (session.participants || []).length,
        consumesQuota: Boolean(row.consumesQuota),
      },
    ];
  });
}

// ---- Calendar days ------------------------------------------------------------------------------

function parts(day) {
  const [year, month, date] = day.split("-").map(Number);
  return { year, month, date };
}

// A day counted in UTC on purpose: these are calendar days with no time, so no zone can move them.
// `Date.UTC` rolls an overflowing day into the next month (32 October is 1 November).
function format(year, month, date) {
  const utc = new Date(Date.UTC(year, month - 1, date));
  const pad = (number) => String(number).padStart(2, "0");
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}

function addDays(day, count) {
  const { year, month, date } = parts(day);
  return format(year, month, date + count);
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addMonths(day, count) {
  const { year, month, date } = parts(day);
  const index = year * 12 + (month - 1) + count;
  const targetYear = Math.floor(index / 12);
  const targetMonth = (index % 12) + 1;
  return format(targetYear, targetMonth, Math.min(date, daysInMonth(targetYear, targetMonth)));
}

function daysBetweenInclusive(from, to) {
  const a = parts(from);
  const b = parts(to);
  return (
    (Date.UTC(b.year, b.month - 1, b.date) - Date.UTC(a.year, a.month - 1, a.date)) / 86400000 + 1
  );
}

function mondayOf(day) {
  const { year, month, date } = parts(day);
  const weekday = new Date(Date.UTC(year, month - 1, date)).getUTCDay(); // 0 is Sunday
  return addDays(day, -((weekday + 6) % 7));
}

// ---- What a membership or a package says ---------------------------------------------------------

// A pause written backwards (its end before its start) is no pause: it covers no day and moves no
// end date. `packageProblems` and `membershipProblems` name it.
const pausesOf = (record) =>
  (record.pauses || []).filter((pause) => pause.startsOn <= pause.endsOn);

const pauseOn = (record, day) =>
  pausesOf(record).some((pause) => pause.startsOn <= day && day <= pause.endsOn);

// Days added to an end date by the pauses that say so, each day once where pauses overlap.
function pauseExtension(record) {
  const ranges = pausesOf(record)
    .filter((pause) => pause.extendsEnd)
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn));
  let days = 0;
  let coveredUntil = null;
  for (const { startsOn, endsOn } of ranges) {
    const from = coveredUntil && startsOn <= coveredUntil ? addDays(coveredUntil, 1) : startsOn;
    if (from <= endsOn) days += daysBetweenInclusive(from, endsOn);
    if (!coveredUntil || endsOn > coveredUntil) coveredUntil = endsOn;
  }
  return days;
}

const kindMatches = (record, use) => {
  if (!record.forSessions || record.forSessions === "any") return true;
  return record.forSessions === "individual" ? use.participants <= 1 : use.participants > 1;
};

function membershipEnd(membership) {
  return membership.endsOn ? addDays(membership.endsOn, pauseExtension(membership)) : null;
}

/** The period of `membership` that `day` falls in: its index from the first, and its first and last day. */
function periodOf(membership, day) {
  const start = membership.startsOn;
  const step = membership.period === "year" ? 12 : 1;
  if (membership.periodsFrom === "calendar") {
    const s = parts(start);
    const d = parts(day);
    const index = step === 12 ? d.year - s.year : d.year * 12 + d.month - (s.year * 12 + s.month);
    const first = step === 12 ? format(d.year, 1, 1) : format(d.year, d.month, 1);
    const next = addMonths(first, step);
    return { index, startsOn: first < start ? start : first, endsOn: addDays(next, -1) };
  }
  const s = parts(start);
  const d = parts(day);
  let index = Math.floor((d.year * 12 + d.month - (s.year * 12 + s.month)) / step);
  while (index > 0 && addMonths(start, index * step) > day) index -= 1;
  while (addMonths(start, (index + 1) * step) <= day) index += 1;
  return {
    index,
    startsOn: addMonths(start, index * step),
    endsOn: addDays(addMonths(start, (index + 1) * step), -1),
  };
}

function packageStart(pack, firstUseDay) {
  if (pack.validFrom === "firstSession") return firstUseDay ?? null;
  if (pack.validFrom === "date" && pack.startsOn) return pack.startsOn;
  return pack.boughtOn;
}

function packageEnd(pack, startsOn) {
  if (pack.validUntil) return pack.validUntil;
  if (!startsOn || !pack.validForCount || !pack.validForUnit) return null;
  const count = pack.validForCount;
  let last;
  if (pack.validForUnit === "month") {
    const same = addMonths(startsOn, count);
    // The later month has no such date: `addMonths` gave its last day, which is the last valid day.
    last = parts(same).date < parts(startsOn).date ? same : addDays(same, -1);
  } else {
    last = addDays(startsOn, (pack.validForUnit === "week" ? count * 7 : count) - 1);
  }
  return addDays(last, pauseExtension(pack));
}

// ---- Counting ------------------------------------------------------------------------------------

/** Sessions of `membership` allowed in the period `index`, given the sessions it covered in each
 *  earlier period. `null` is unlimited. Sessions used in a period come first from those carried in. */
function allowedIn(membership, index, usedByPeriod) {
  const base = membership.sessionsPerPeriod;
  if (base === undefined || base === null) return null;
  let carriedIn = 0;
  for (let k = 0; k < index; k += 1) {
    const used = usedByPeriod.get(k) || 0;
    const left = base + carriedIn - used;
    if (membership.carryOver === "always") carriedIn = Math.max(0, left);
    // A period's own unused sessions only: what it carried in and did not use is not carried again.
    else if (membership.carryOver === "nextPeriod") {
      carriedIn = Math.max(0, base - Math.max(0, used - carriedIn));
    } else carriedIn = 0;
  }
  return base + carriedIn;
}

function byChronology(a, b) {
  return (
    a.day.localeCompare(b.day) ||
    String(a.startsAt ?? "").localeCompare(String(b.startsAt ?? "")) ||
    String(a.sessionId).localeCompare(String(b.sessionId)) ||
    String(a.id).localeCompare(String(b.id))
  );
}

/**
 * Which membership or package each use is covered by: a Map from the use's id to
 * `{ collection, id }`, or to `null` when nothing covers it. A use that does not use up a session
 * (`consumesQuota` false) is not in the map.
 */
export function coverSessions({ memberships = [], packages = [], uses = [] }) {
  const coverage = new Map();
  const membershipUse = new Map(
    memberships.map((m) => [m.id, { byPeriod: new Map(), byWeek: new Map() }]),
  );
  const packageUse = new Map(
    packages.map((p) => [p.id, { used: 0, firstDay: null, sessions: new Set() }]),
  );

  // Who uses up a session at each session, so rule 2 can see a pair before either is counted.
  const countingAt = new Map();
  for (const use of uses) {
    if (!use.consumesQuota) continue;
    if (!countingAt.has(use.sessionId)) countingAt.set(use.sessionId, new Set());
    countingAt.get(use.sessionId).add(use.clientId);
  }
  const records = { memberships, packages, membershipUse, packageUse, countingAt };
  for (const use of [...uses].sort(byChronology)) {
    if (!use.consumesQuota) continue;
    coverage.set(use.id, coverOne(use, records));
  }
  return coverage;
}

function holdsPackage(pack, clientId) {
  return pack.clientId === clientId || (pack.sharedWith || []).includes(clientId);
}

// The package's first and last valid day as seen from `day`, and whether it has not started yet.
function packageWindow(pack, counts, day) {
  const waiting = pack.validFrom === "firstSession" && !counts.firstDay;
  const startsOn = packageStart(pack, counts.firstDay ?? day);
  return { startsOn, endsOn: packageEnd(pack, startsOn), waiting };
}

function charge(pack, counts, use) {
  counts.used += 1;
  counts.firstDay ??= use.day;
  counts.sessions.add(use.sessionId);
  return { collection: PACKAGES, id: pack.id };
}

function coverOne(use, { memberships, packages, membershipUse, packageUse, countingAt }) {
  // Rule 2: holders of a pair package training together.
  const present = countingAt.get(use.sessionId) || new Set();
  const pairs = packages
    .filter(
      (pack) =>
        pack.onePerSession &&
        holdsPackage(pack, use.clientId) &&
        [...present].some((other) => other !== use.clientId && holdsPackage(pack, other)),
    )
    .sort((a, b) => a.boughtOn.localeCompare(b.boughtOn) || a.id.localeCompare(b.id));
  const charged = pairs.find((pack) => packageUse.get(pack.id).sessions.has(use.sessionId));
  if (charged) return { collection: PACKAGES, id: charged.id };
  for (const pack of pairs) {
    const counts = packageUse.get(pack.id);
    if (packageCovers(pack, use, { counts, ...packageWindow(pack, counts, use.day) })) {
      return charge(pack, counts, use);
    }
  }

  // Rule 3: a membership.
  const ownMemberships = memberships
    .filter((m) => m.clientId === use.clientId)
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn) || a.id.localeCompare(b.id));
  for (const membership of ownMemberships) {
    if (!membershipCovers(membership, use, membershipUse.get(membership.id))) continue;
    const counts = membershipUse.get(membership.id);
    const { index } = periodOf(membership, use.day);
    const week = mondayOf(use.day);
    counts.byPeriod.set(index, (counts.byPeriod.get(index) || 0) + 1);
    counts.byWeek.set(week, (counts.byWeek.get(week) || 0) + 1);
    return { collection: MEMBERSHIPS, id: membership.id };
  }

  // Rule 4: a running package before one that has not started, then the one that ends soonest,
  // then the one bought first.
  const candidates = packages
    .filter((pack) => holdsPackage(pack, use.clientId))
    .map((pack) => {
      const counts = packageUse.get(pack.id);
      return { pack, counts, ...packageWindow(pack, counts, use.day) };
    })
    .filter(({ pack, counts, startsOn, endsOn }) =>
      packageCovers(pack, use, { counts, startsOn, endsOn }),
    )
    .sort(
      (a, b) =>
        Number(a.waiting) - Number(b.waiting) ||
        (a.endsOn ?? "9999-12-31").localeCompare(b.endsOn ?? "9999-12-31") ||
        a.pack.boughtOn.localeCompare(b.pack.boughtOn) ||
        a.pack.id.localeCompare(b.pack.id),
    );
  const chosen = candidates[0];
  return chosen ? charge(chosen.pack, chosen.counts, use) : null;
}

function membershipCovers(membership, use, counts) {
  const end = membershipEnd(membership);
  if (use.day < membership.startsOn || (end && use.day > end)) return false;
  if (pauseOn(membership, use.day) || !kindMatches(membership, use)) return false;
  const weekly = membership.sessionsPerWeek;
  if (
    weekly !== undefined &&
    weekly !== null &&
    (counts.byWeek.get(mondayOf(use.day)) || 0) >= weekly
  ) {
    return false;
  }
  const { index } = periodOf(membership, use.day);
  const allowed = allowedIn(membership, index, counts.byPeriod);
  return allowed === null || (counts.byPeriod.get(index) || 0) < allowed;
}

function packageCovers(pack, use, { counts, startsOn, endsOn }) {
  if (use.day < pack.boughtOn && pack.validFrom !== "date") return false;
  if (!startsOn || use.day < startsOn || (endsOn && use.day > endsOn)) return false;
  if (pauseOn(pack, use.day) || !kindMatches(pack, use)) return false;
  return counts.used < pack.sessions;
}

// ---- What is left --------------------------------------------------------------------------------

const coveredByRecord = (coverage, collection, id) => (useId) => {
  const covered = coverage.get(useId);
  return Boolean(covered) && covered.collection === collection && covered.id === id;
};

/**
 * A package as the trainer and the client read it: `{ sessions, used, left, startsOn, endsOn }`.
 * `startsOn` is null for a package counted from its first session that has covered none; `endsOn`
 * is null for one that never ends. `coverage` is what coverSessions returned for the same uses.
 */
export function packageState(pack, { uses = [], coverage }) {
  const covers = coveredByRecord(coverage, PACKAGES, pack.id);
  const covered = uses.filter((use) => covers(use.id)).sort(byChronology);
  const used = pack.onePerSession
    ? new Set(covered.map((use) => use.sessionId)).size
    : covered.length;
  const startsOn = packageStart(pack, covered[0]?.day ?? null);
  return {
    sessions: pack.sessions,
    used,
    left: Math.max(0, pack.sessions - used),
    startsOn,
    endsOn: packageEnd(pack, startsOn),
  };
}

/**
 * The period of a membership that `day` falls in: `{ periodStartsOn, periodEndsOn, allowed, used,
 * left, paused }`. `allowed` and `left` are null for an unlimited membership. Null before the
 * membership starts and after it ends: there is no period then.
 */
export function membershipState(membership, { uses = [], coverage, day }) {
  const end = membershipEnd(membership);
  if (day < membership.startsOn || (end && day > end)) return null;
  const covers = coveredByRecord(coverage, MEMBERSHIPS, membership.id);
  const usedByPeriod = new Map();
  for (const use of uses) {
    if (!covers(use.id)) continue;
    const { index } = periodOf(membership, use.day);
    usedByPeriod.set(index, (usedByPeriod.get(index) || 0) + 1);
  }
  const period = periodOf(membership, day);
  const allowed = allowedIn(membership, period.index, usedByPeriod);
  const used = usedByPeriod.get(period.index) || 0;
  return {
    periodStartsOn: period.startsOn,
    periodEndsOn: period.endsOn,
    allowed,
    used,
    left: allowed === null ? null : Math.max(0, allowed - used),
    paused: pauseOn(membership, day),
  };
}

// ---- What a form must not write ------------------------------------------------------------------

const DAY_FORM = /^\d{4}-\d{2}-\d{2}$/;
const wholeAboveZero = (value) => Number.isInteger(value) && value > 0;

function dayProblems(record, fields) {
  return fields
    .filter((field) => record[field] !== undefined && !DAY_FORM.test(String(record[field])))
    .map((field) => `${field} must be a day written YYYY-MM-DD`);
}

function pauseProblems(record) {
  const pauses = record.pauses || [];
  const problems = pauses.some(
    (pause) => !DAY_FORM.test(String(pause.startsOn)) || !DAY_FORM.test(String(pause.endsOn)),
  )
    ? ["a pause must have days written YYYY-MM-DD"]
    : [];
  if (pauses.some((pause) => pause.endsOn < pause.startsOn)) {
    problems.push("a pause ends before it starts");
  }
  return problems;
}

/**
 * What is wrong with a package a form is about to write, as sentences for the person fixing the
 * form; empty when nothing is. The schema checks types; this checks what the rules above rely on.
 */
export function packageProblems(pack) {
  const problems = [];
  if (!wholeAboveZero(pack.sessions)) problems.push("sessions must be a whole number above 0");
  problems.push(...dayProblems(pack, ["boughtOn", "startsOn", "validUntil"]));
  const hasCount = pack.validForCount !== undefined;
  if (hasCount !== (pack.validForUnit !== undefined)) {
    problems.push("validForCount and validForUnit go together");
  } else if (hasCount && !wholeAboveZero(pack.validForCount)) {
    problems.push("validForCount must be a whole number above 0");
  }
  if (pack.validFrom === "date" && !pack.startsOn) problems.push("validFrom date needs startsOn");
  problems.push(...pauseProblems(pack));
  return problems;
}

/** What is wrong with a membership a form is about to write; empty when nothing is. */
export function membershipProblems(membership) {
  const problems = [];
  for (const field of ["sessionsPerPeriod", "sessionsPerWeek"]) {
    if (membership[field] !== undefined && !wholeAboveZero(membership[field])) {
      problems.push(`${field} must be a whole number above 0`);
    }
  }
  problems.push(...dayProblems(membership, ["startsOn", "endsOn"]));
  if (membership.endsOn && membership.endsOn < membership.startsOn) {
    problems.push("endsOn is before startsOn");
  }
  problems.push(...pauseProblems(membership));
  return problems;
}
