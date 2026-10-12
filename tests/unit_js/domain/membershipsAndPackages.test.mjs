// tests/unit_js/domain/membershipsAndPackages.test.mjs
// Which membership or package a session uses, and what is left (src/domain/membershipsAndPackages.js).
// One test per scenario of use_cases/uc10_memberships_and_session_packages.md, named by its number.
// What a caller depends on: the same records always give the same answer, whatever order the
// sessions arrive in, and nothing is written.

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  coverSessions,
  membershipProblems,
  membershipState,
  packageProblems,
  packageState,
  usesFromAttendance,
} from "../../../src/domain/membershipsAndPackages.js";

// One client at one session that uses up a session of what they paid for.
function use(id, clientId, day, extra = {}) {
  return {
    id,
    clientId,
    day,
    sessionId: `s-${id}`,
    participants: 1,
    consumesQuota: true,
    ...extra,
  };
}

const pack = (extra = {}) => ({
  id: "k1",
  clientId: "ana",
  sessions: 8,
  boughtOn: "2026-10-12",
  validFrom: "purchase",
  validForCount: 2,
  validForUnit: "month",
  ...extra,
});

const monthly = (extra = {}) => ({
  id: "m1",
  clientId: "ana",
  period: "month",
  periodsFrom: "calendar",
  startsOn: "2026-10-01",
  ...extra,
});

const coveredBy = (coverage, useId) => coverage.get(useId)?.id ?? null;

test("S1: a package valid 2 months from the purchase is used once per session, until its last day", () => {
  const records = {
    packages: [pack()],
    uses: [
      use("u1", "ana", "2026-10-14"),
      use("u2", "ana", "2026-10-21"),
      use("u3", "ana", "2026-12-12"),
    ],
  };
  const coverage = coverSessions(records);
  assert.equal(coveredBy(coverage, "u1"), "k1");
  assert.equal(coveredBy(coverage, "u2"), "k1");
  assert.equal(coveredBy(coverage, "u3"), null, "the day after its last valid day");
  assert.deepEqual(packageState(records.packages[0], { ...records, coverage }), {
    sessions: 8,
    used: 2,
    left: 6,
    startsOn: "2026-10-12",
    endsOn: "2026-12-11",
  });
});

test("S2: validity counted from the first session, and a package with no validity never ends", () => {
  const fromFirst = pack({ validFrom: "firstSession", validForCount: 90, validForUnit: "day" });
  const records = { packages: [fromFirst], uses: [use("u1", "ana", "2026-10-20")] };
  const coverage = coverSessions(records);
  const state = packageState(fromFirst, { ...records, coverage });
  assert.equal(state.startsOn, "2026-10-20");
  assert.equal(state.endsOn, "2027-01-17");

  const unused = packageState(fromFirst, { packages: [fromFirst], uses: [], coverage: new Map() });
  assert.equal(unused.startsOn, null, "not started until the first session");

  const forever = pack({ validForCount: undefined, validForUnit: undefined });
  const late = { packages: [forever], uses: [use("u1", "ana", "2031-01-01")] };
  assert.equal(coveredBy(coverSessions(late), "u1"), "k1");
});

test("S2: a package valid from a set date covers nothing before it", () => {
  const dated = pack({ validFrom: "date", startsOn: "2026-11-01" });
  const coverage = coverSessions({
    packages: [dated],
    uses: [use("u1", "ana", "2026-10-31"), use("u2", "ana", "2026-11-01")],
  });
  assert.equal(coveredBy(coverage, "u1"), null);
  assert.equal(coveredBy(coverage, "u2"), "k1");
});

test("S3: an end date the trainer moved by hand wins over the validity", () => {
  const moved = pack({ validUntil: "2027-01-31" });
  const records = { packages: [moved], uses: [use("u1", "ana", "2027-01-20")] };
  const coverage = coverSessions(records);
  assert.equal(coveredBy(coverage, "u1"), "k1");
  assert.equal(packageState(moved, { ...records, coverage }).endsOn, "2027-01-31");
});

test("S4: a calendar month allows its sessions from the first of each month", () => {
  const eight = monthly({ sessionsPerPeriod: 8 });
  const october = Array.from({ length: 9 }, (_, i) =>
    use(`o${i}`, "ana", `2026-10-${String(i + 10)}`),
  );
  const records = { memberships: [eight], uses: [...october, use("n1", "ana", "2026-11-01")] };
  const coverage = coverSessions(records);
  assert.equal(october.filter((u) => coveredBy(coverage, u.id) === "m1").length, 8);
  assert.equal(coveredBy(coverage, "o8"), null, "the ninth session in October");
  assert.equal(coveredBy(coverage, "n1"), "m1", "November is a new month");
  assert.deepEqual(membershipState(eight, { ...records, coverage, day: "2026-10-31" }), {
    periodStartsOn: "2026-10-01",
    periodEndsOn: "2026-10-31",
    allowed: 8,
    used: 8,
    left: 0,
    paused: false,
  });
});

test("S4: a month counted from the start date runs from the 12th to the 11th", () => {
  const fromStart = monthly({
    periodsFrom: "startDate",
    startsOn: "2026-10-12",
    sessionsPerPeriod: 1,
  });
  const records = {
    memberships: [fromStart],
    uses: [
      use("u1", "ana", "2026-10-12"),
      use("u2", "ana", "2026-11-11"),
      use("u3", "ana", "2026-11-12"),
    ],
  };
  const coverage = coverSessions(records);
  assert.equal(coveredBy(coverage, "u2"), null, "still the first month, already used");
  assert.equal(coveredBy(coverage, "u3"), "m1");
  const state = membershipState(fromStart, { ...records, coverage, day: "2026-11-20" });
  assert.equal(state.periodStartsOn, "2026-11-12");
  assert.equal(state.periodEndsOn, "2026-12-11");
});

test("S4: a month started on the 31st ends on the last day of a shorter month", () => {
  const fromStart = monthly({ periodsFrom: "startDate", startsOn: "2027-01-31" });
  const state = membershipState(fromStart, { uses: [], coverage: new Map(), day: "2027-02-15" });
  assert.equal(state.periodStartsOn, "2027-01-31");
  assert.equal(state.periodEndsOn, "2027-02-27");
  const march = membershipState(fromStart, { uses: [], coverage: new Map(), day: "2027-03-15" });
  assert.equal(march.periodStartsOn, "2027-02-28");
});

test("S5: a yearly membership with a fixed end covers nothing after it", () => {
  const year = monthly({
    id: "m2",
    period: "year",
    periodsFrom: "startDate",
    startsOn: "2026-03-12",
    endsOn: "2027-03-11",
  });
  const coverage = coverSessions({
    memberships: [year],
    uses: [use("u1", "ana", "2027-03-11"), use("u2", "ana", "2027-03-12")],
  });
  assert.equal(coveredBy(coverage, "u1"), "m2");
  assert.equal(coveredBy(coverage, "u2"), null);
});

test("S6: no number of sessions means unlimited; a weekly number limits each week", () => {
  const unlimited = monthly();
  const many = Array.from({ length: 20 }, (_, i) =>
    use(`u${i}`, "ana", `2026-10-${String(i + 10)}`),
  );
  const coverage = coverSessions({ memberships: [unlimited], uses: many });
  assert.ok(many.every((u) => coveredBy(coverage, u.id) === "m1"));
  const state = membershipState(unlimited, { uses: many, coverage, day: "2026-10-20" });
  assert.equal(state.allowed, null);
  assert.equal(state.left, null);

  // Monday 12 and Wednesday 14 October are one week; Monday 19 starts the next.
  const once = monthly({ sessionsPerWeek: 1 });
  const week = coverSessions({
    memberships: [once],
    uses: [
      use("u1", "ana", "2026-10-12"),
      use("u2", "ana", "2026-10-14"),
      use("u3", "ana", "2026-10-19"),
    ],
  });
  assert.equal(coveredBy(week, "u1"), "m1");
  assert.equal(coveredBy(week, "u2"), null);
  assert.equal(coveredBy(week, "u3"), "m1");
});

test("S7: unused sessions are lost, kept for one month, or kept", () => {
  const records = (carryOver) => {
    const m = monthly({ sessionsPerPeriod: 4, carryOver });
    const uses = [
      use("o1", "ana", "2026-10-05"),
      use("o2", "ana", "2026-10-06"),
      ...Array.from({ length: 7 }, (_, i) => use(`n${i}`, "ana", `2026-11-${String(i + 10)}`)),
    ];
    const coverage = coverSessions({ memberships: [m], uses });
    return membershipState(m, { uses, coverage, day: "2026-11-30" });
  };
  assert.equal(records(undefined).allowed, 4, "absent means lost");
  assert.equal(records("none").allowed, 4);
  assert.equal(records("nextPeriod").allowed, 6, "October's two unused are added to November");
  assert.equal(records("nextPeriod").used, 6);

  // Kept for one month only: September's four do not reach November.
  const m = monthly({ startsOn: "2026-09-01", sessionsPerPeriod: 4, carryOver: "nextPeriod" });
  const none = membershipState(m, { uses: [], coverage: new Map(), day: "2026-11-15" });
  assert.equal(none.allowed, 8, "October's own four and October's four unused");
  const always = membershipState(
    monthly({ startsOn: "2026-09-01", sessionsPerPeriod: 4, carryOver: "always" }),
    { uses: [], coverage: new Map(), day: "2026-11-15" },
  );
  assert.equal(always.allowed, 12);
});

test("S8: a pause covers no session, and moves the end date only when it says so", () => {
  const pause = { startsOn: "2026-10-20", endsOn: "2026-10-26", reason: "holiday" };
  const extended = pack({ pauses: [{ ...pause, extendsEnd: true }] });
  const records = {
    packages: [extended],
    uses: [use("u1", "ana", "2026-10-22"), use("u2", "ana", "2026-12-15")],
  };
  const coverage = coverSessions(records);
  assert.equal(coveredBy(coverage, "u1"), null, "a paused day");
  assert.equal(coveredBy(coverage, "u2"), "k1", "seven days after the old end");
  assert.equal(packageState(extended, { ...records, coverage }).endsOn, "2026-12-18");

  const kept = pack({ pauses: [{ ...pause, extendsEnd: false }] });
  assert.equal(
    packageState(kept, { packages: [kept], uses: [], coverage: new Map() }).endsOn,
    "2026-12-11",
  );

  const yearly = monthly({
    period: "year",
    periodsFrom: "startDate",
    startsOn: "2026-03-12",
    endsOn: "2027-03-11",
    pauses: [{ ...pause, extendsEnd: true }],
  });
  const after = coverSessions({ memberships: [yearly], uses: [use("u3", "ana", "2027-03-18")] });
  assert.equal(coveredBy(after, "u3"), "m1");
});

test("S9: a pair package uses one per session together; a shared family package one per person", () => {
  const pair = pack({ clientId: "maja", sharedWith: ["rok"], onePerSession: true });
  const together = [
    use("u1", "maja", "2026-10-14", { sessionId: "s1", participants: 2 }),
    use("u2", "rok", "2026-10-14", { sessionId: "s1", participants: 2 }),
  ];
  const records = { packages: [pair], uses: together };
  const coverage = coverSessions(records);
  assert.equal(coveredBy(coverage, "u1"), "k1");
  assert.equal(coveredBy(coverage, "u2"), "k1");
  assert.equal(packageState(pair, { ...records, coverage }).used, 1);

  const family = pack({ clientId: "maja", sharedWith: ["rok"] });
  const familyCoverage = coverSessions({ packages: [family], uses: together });
  assert.equal(
    packageState(family, { packages: [family], uses: together, coverage: familyCoverage }).used,
    2,
  );

  const notShared = pack({ clientId: "maja" });
  assert.equal(coveredBy(coverSessions({ packages: [notShared], uses: together }), "u2"), null);
});

test("S10: a package for individual sessions does not cover a group session", () => {
  const personal = pack({ forSessions: "individual" });
  const coverage = coverSessions({
    packages: [personal],
    uses: [use("u1", "ana", "2026-10-14", { participants: 4 }), use("u2", "ana", "2026-10-15")],
  });
  assert.equal(coveredBy(coverage, "u1"), null);
  assert.equal(coveredBy(coverage, "u2"), "k1");
  const group = monthly({ forSessions: "group" });
  assert.equal(
    coveredBy(
      coverSessions({ memberships: [group], uses: [use("u3", "ana", "2026-10-16")] }),
      "u3",
    ),
    null,
  );
});

test("S11: a session that does not use up a session of the package is not counted", () => {
  const coverage = coverSessions({
    packages: [pack()],
    uses: [use("u1", "ana", "2026-10-14", { consumesQuota: false })],
  });
  assert.equal(coverage.has("u1"), false);
});

test("S12: the membership is used first, then the package that ends soonest", () => {
  const membership = monthly({ sessionsPerPeriod: 1 });
  const later = pack({ id: "k-later", boughtOn: "2026-10-01", validForCount: 6 });
  const sooner = pack({ id: "k-sooner", boughtOn: "2026-10-10", validForCount: 1 });
  const coverage = coverSessions({
    memberships: [membership],
    packages: [later, sooner],
    uses: [
      use("u1", "ana", "2026-10-14"),
      use("u2", "ana", "2026-10-15"),
      use("u3", "ana", "2026-11-20"),
    ],
  });
  assert.equal(coveredBy(coverage, "u1"), "m1");
  assert.equal(coveredBy(coverage, "u2"), "k-sooner");
  assert.equal(coverage.get("u2").collection, "sessionPackages");
  assert.equal(coveredBy(coverage, "u3"), "m1", "a new month of the membership");
});

test("the answer does not depend on the order the sessions arrive in", () => {
  const records = {
    memberships: [monthly({ sessionsPerPeriod: 2 })],
    packages: [pack()],
    uses: [
      use("u1", "ana", "2026-10-14"),
      use("u2", "ana", "2026-10-15"),
      use("u3", "ana", "2026-10-16"),
      use("u4", "ana", "2026-10-17"),
    ],
  };
  const forward = coverSessions(records);
  const backward = coverSessions({ ...records, uses: [...records.uses].reverse() });
  for (const u of records.uses) assert.deepEqual(backward.get(u.id), forward.get(u.id), u.id);
  assert.equal(coveredBy(forward, "u1"), "m1");
  assert.equal(coveredBy(forward, "u3"), "k1");
});

test("the uses are read from attendance: its session's day, how many were booked, and whether it counts", () => {
  const sessions = [
    {
      id: "s1",
      startDate: new Date(2026, 9, 14, 18, 0).toISOString(),
      participants: ["ana", "bor"],
    },
    { id: "s2", startDate: new Date(2026, 9, 15, 23, 30).toISOString(), participants: ["ana"] },
  ];
  const sessionAttendance = [
    { id: "a1", sessionId: "s1", clientId: "ana", status: "attended", consumesQuota: true },
    { id: "a2", sessionId: "s1", clientId: "bor", status: "noShow", consumesQuota: true },
    { id: "a3", sessionId: "s2", clientId: "ana", status: "noShow", consumesQuota: false },
    { id: "a4", sessionId: "gone", clientId: "ana", status: "attended", consumesQuota: true },
  ];
  assert.deepEqual(usesFromAttendance({ sessionAttendance, sessions }), [
    {
      id: "a1",
      clientId: "ana",
      sessionId: "s1",
      day: "2026-10-14",
      startsAt: sessions[0].startDate,
      participants: 2,
      consumesQuota: true,
    },
    {
      id: "a2",
      clientId: "bor",
      sessionId: "s1",
      day: "2026-10-14",
      startsAt: sessions[0].startDate,
      participants: 2,
      consumesQuota: true,
    },
    // A late evening stays on its own day where the trainer is.
    {
      id: "a3",
      clientId: "ana",
      sessionId: "s2",
      day: "2026-10-15",
      startsAt: sessions[1].startDate,
      participants: 1,
      consumesQuota: false,
    },
  ]);
});

// Found in review on 2026-10-12, one test each.

test("S9: a pair training together uses the pair package, whatever their ids, before a membership", () => {
  const membership = monthly({ clientId: "a", sessionsPerPeriod: 4 });
  const pair = pack({ clientId: "a", sharedWith: ["b"], onePerSession: true });
  for (const [first, second] of [
    ["at-s1-a", "at-s1-b"],
    ["at-s1-z", "at-s1-b"],
  ]) {
    const uses = [
      use(first, "a", "2026-10-14", { sessionId: "s1", participants: 2 }),
      use(second, "b", "2026-10-14", { sessionId: "s1", participants: 2 }),
    ];
    const coverage = coverSessions({ memberships: [membership], packages: [pair], uses });
    assert.equal(coveredBy(coverage, first), "k1", first);
    assert.equal(coveredBy(coverage, second), "k1", first);
    assert.equal(packageState(pair, { uses, coverage }).used, 1);
  }
  // Alone, the holder with a membership uses the membership.
  const alone = [use("u1", "a", "2026-10-15", { sessionId: "s2" })];
  const coverage = coverSessions({ memberships: [membership], packages: [pair], uses: alone });
  assert.equal(coveredBy(coverage, "u1"), "m1");
});

test("S2: a package counted from its first session waits until the running ones are used", () => {
  const running = pack({ id: "R", sessions: 5, boughtOn: "2026-01-01" });
  const waiting = pack({
    id: "F",
    sessions: 5,
    boughtOn: "2026-01-01",
    validFrom: "firstSession",
    validForCount: 2,
    validForUnit: "week",
  });
  const uses = ["05", "12", "19", "26"].map((d) => use(`u${d}`, "ana", `2026-01-${d}`));
  const coverage = coverSessions({ packages: [running, waiting], uses });
  assert.ok(uses.every((u) => coveredBy(coverage, u.id) === "R"));
  assert.equal(packageState(waiting, { uses, coverage }).startsOn, null);
});

test("S8: a pause written backwards moves nothing, and overlapping pauses count each day once", () => {
  const backwards = pack({
    pauses: [{ startsOn: "2026-10-30", endsOn: "2026-10-20", extendsEnd: true }],
  });
  const none = { uses: [], coverage: new Map() };
  assert.equal(packageState(backwards, none).endsOn, "2026-12-11");
  const overlapping = pack({
    pauses: [
      { startsOn: "2026-10-20", endsOn: "2026-10-26", extendsEnd: true },
      { startsOn: "2026-10-24", endsOn: "2026-10-28", extendsEnd: true },
    ],
  });
  assert.equal(packageState(overlapping, none).endsOn, "2026-12-20", "9 days, not 12");
});

test("S3: an end date set by hand is final; a pause does not move it", () => {
  const moved = pack({
    validUntil: "2027-01-31",
    pauses: [{ startsOn: "2026-10-20", endsOn: "2026-10-26", extendsEnd: true }],
  });
  assert.equal(packageState(moved, { uses: [], coverage: new Map() }).endsOn, "2027-01-31");
});

test("S1: a package bought on the 31st and valid one month ends on the last day of February", () => {
  const none = { uses: [], coverage: new Map() };
  assert.equal(
    packageState(pack({ boughtOn: "2027-01-31", validForCount: 1 }), none).endsOn,
    "2027-02-28",
  );
  assert.equal(
    packageState(pack({ boughtOn: "2027-01-28", validForCount: 1 }), none).endsOn,
    "2027-02-27",
  );
  assert.equal(
    packageState(pack({ boughtOn: "2028-02-29", validForCount: 12 }), none).endsOn,
    "2029-02-28",
  );
});

test("a membership has no period before it starts or after it ends, and says when it is paused", () => {
  const ended = monthly({
    endsOn: "2026-12-31",
    pauses: [{ startsOn: "2026-11-02", endsOn: "2026-11-08", extendsEnd: false }],
  });
  const none = { uses: [], coverage: new Map() };
  assert.equal(membershipState(ended, { ...none, day: "2026-09-30" }), null);
  assert.equal(membershipState(ended, { ...none, day: "2027-01-01" }), null);
  assert.equal(membershipState(ended, { ...none, day: "2026-11-05" }).paused, true);
  assert.equal(membershipState(ended, { ...none, day: "2026-11-09" }).paused, false);
});

test("two sessions on one day are counted in the order they started", () => {
  const one = monthly({ sessionsPerPeriod: 1 });
  const coverage = coverSessions({
    memberships: [one],
    uses: [
      use("u-evening", "ana", "2026-10-14", {
        sessionId: "a",
        startsAt: "2026-10-14T16:00:00.000Z",
      }),
      use("u-morning", "ana", "2026-10-14", {
        sessionId: "b",
        startsAt: "2026-10-14T06:00:00.000Z",
      }),
    ],
  });
  assert.equal(coveredBy(coverage, "u-morning"), "m1");
  assert.equal(coveredBy(coverage, "u-evening"), null);
});

test("a record a form could write wrongly is named before the rules read it", () => {
  assert.deepEqual(packageProblems(pack()), []);
  assert.deepEqual(
    packageProblems(
      pack({
        sessions: 2.5,
        validForUnit: undefined,
        validFrom: "date",
        boughtOn: "2026-3-5",
        pauses: [{ startsOn: "2026-10-30", endsOn: "2026-10-20", extendsEnd: true }],
      }),
    ),
    [
      "sessions must be a whole number above 0",
      "boughtOn must be a day written YYYY-MM-DD",
      "validForCount and validForUnit go together",
      "validFrom date needs startsOn",
      "a pause ends before it starts",
    ],
  );
  assert.deepEqual(membershipProblems(monthly()), []);
  assert.deepEqual(
    membershipProblems(
      monthly({ startsOn: "2026-10-01", endsOn: "2026-09-30", sessionsPerPeriod: 0 }),
    ),
    ["sessionsPerPeriod must be a whole number above 0", "endsOn is before startsOn"],
  );
});

test("another client's membership or package covers nothing", () => {
  const coverage = coverSessions({
    memberships: [monthly({ clientId: "bor" })],
    packages: [pack({ clientId: "bor" })],
    uses: [use("u1", "ana", "2026-10-14")],
  });
  assert.equal(coverage.get("u1"), null);
});
