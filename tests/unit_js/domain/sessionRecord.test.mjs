// tests/unit_js/domain/sessionRecord.test.mjs
// The session form's output, which had no test at all before TODO §24.7 — it was reachable only by
// filling in a real form in a real browser, so the rules below were only ever verified by clicking.
//
// The two that would cost a trainer real data if they broke:
//   • An upsert MERGES. A stored session carries fields this form never edits — `completed` and
//     `duration`, stamped when a session is finished — and a wholesale replace would drop them,
//     silently un-completing a session by editing its title.
//   • Invites go only to NEWLY assigned participants. Re-saving an unchanged session must not
//     re-prompt an invite for everybody already on it.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildPlanningSessionMeta,
  buildRealSessionMeta,
  buildSessionRecord,
  computeSessionDayBucket,
  computeTimeLabel,
  newlyAssignedParticipantIds,
  sessionBelongsToSlot,
  upsertSessionRecord,
} from "../../../src/domain/sessionRecord.js";

const isoDate = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
};

test("a time label is a range, a single time, or an honest unknown", () => {
  assert.equal(computeTimeLabel("09:00", "10:00", "Date Unknown"), "09:00 - 10:00");
  assert.equal(computeTimeLabel("09:00", "", "Date Unknown"), "09:00");
  // An end with no start is not a range — there is nothing to show but the unknown.
  assert.equal(computeTimeLabel("", "10:00", "Date Unknown"), "Date Unknown");
  assert.equal(computeTimeLabel("", "", "Date Unknown"), "Date Unknown");
});

// Compared at midnight, not by elapsed hours: "tomorrow" is a calendar fact, and a session 20 hours
// out is tomorrow or today depending only on what time it is now.
test("the day bucket is a calendar comparison, not an elapsed-hours one", () => {
  assert.equal(computeSessionDayBucket(new Date(`${isoDate(0)}T23:59`)), "today");
  assert.equal(computeSessionDayBucket(new Date(`${isoDate(0)}T00:01`)), "today");
  assert.equal(computeSessionDayBucket(new Date(`${isoDate(1)}T00:01`)), "tomorrow");
  assert.equal(computeSessionDayBucket(new Date(`${isoDate(3)}T09:00`)), "upcoming");
  assert.equal(computeSessionDayBucket(new Date(`${isoDate(-1)}T09:00`)), "yesterday");
  assert.equal(computeSessionDayBucket(new Date(`${isoDate(-9)}T09:00`)), "yesterday");
});

test("a session record carries every field the dashboard reads", () => {
  const record = buildSessionRecord({
    sessionId: "s1",
    sessionName: "Group S&C",
    sessionDate: isoDate(0),
    startTime: "18:00",
    timeLabel: "18:00 - 19:00",
    location: "Trib gym base",
    clientRoutines: [
      { clientId: "c1", routineId: "r1" },
      { clientId: "c2", routineId: "r2" },
    ],
  });

  assert.equal(record.id, "s1");
  assert.equal(record.title, "Group S&C");
  assert.equal(record.time, "18:00 - 19:00");
  assert.deepEqual(record.participants, ["c1", "c2"]);
  assert.equal(record.routineId, "r1", "the first assignment's routine is the session's");
  assert.equal(record.maxCapacity, 2);
  assert.equal(record.day, "today");
  assert.equal(new Date(record.startDate).getHours(), 18);
});

test("a session with no start time still gets a valid timestamp", () => {
  const record = buildSessionRecord({
    sessionId: "s1",
    sessionName: "Untimed",
    sessionDate: isoDate(0),
    startTime: "",
    timeLabel: "Date Unknown",
    location: "",
    clientRoutines: [],
  });

  assert.equal(Number.isNaN(new Date(record.startDate).getTime()), false);
  assert.equal(record.routineId, "");
  assert.equal(record.maxCapacity, 0);
});

test("an upsert merges, so editing a title cannot un-complete a session", () => {
  const sessions = [
    {
      id: "s1",
      title: "Old name",
      completed: true,
      duration: 3600,
      participants: ["c1"],
    },
  ];

  upsertSessionRecord(sessions, {
    id: "s1",
    title: "New name",
    participants: ["c1", "c2"],
  });

  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].title, "New name");
  assert.deepEqual(sessions[0].participants, ["c1", "c2"]);
  assert.equal(sessions[0].completed, true, "a field this form never edits must survive the edit");
  assert.equal(sessions[0].duration, 3600);
});

test("an upsert of an unknown id appends rather than replacing something else", () => {
  const sessions = [{ id: "s1", title: "First" }];
  upsertSessionRecord(sessions, { id: "s2", title: "Second" });
  assert.deepEqual(
    sessions.map((session) => session.id),
    ["s1", "s2"],
  );
});

test("only newly assigned participants are invited", () => {
  const clientRoutines = [{ clientId: "c1" }, { clientId: "c2" }, { clientId: "c3" }];

  assert.deepEqual(newlyAssignedParticipantIds(["c1"], clientRoutines), ["c2", "c3"]);
  // Re-saving an unchanged session invites nobody.
  assert.deepEqual(newlyAssignedParticipantIds(["c1", "c2", "c3"], clientRoutines), []);
  // A brand-new session has no previous list at all.
  assert.deepEqual(newlyAssignedParticipantIds(undefined, clientRoutines), ["c1", "c2", "c3"]);
  // Removing somebody is not an invite event.
  assert.deepEqual(newlyAssignedParticipantIds(["c1", "c9"], [{ clientId: "c1" }]), []);
});

test("a planning session is flagged as having no slot; a real one is not", () => {
  const identity = {
    sessionId: "s1",
    sessionName: "Winter block",
    sessionDate: isoDate(0),
    timeLabel: "Date Unknown",
    location: "",
  };

  const planning = buildPlanningSessionMeta(identity);
  const real = buildRealSessionMeta(identity);

  assert.equal(planning.isPlanning, true);
  assert.equal("isPlanning" in real, false, "the flag every downstream guard reads must be absent");
  assert.deepEqual(planning.titles, ["Winter block"]);
  assert.deepEqual(real.titles, ["Winter block"]);
});

test("a slot claims every stored row it was merged from", () => {
  // The day timeline merges sessions sharing a time and place into one card, so the meta the
  // clipboard runs can stand for several rows (`ids`). Everything that writes back onto "the
  // session behind the clipboard" — completing it, re-timing it, deleting it — has to agree on
  // which rows those are.
  const merged = { id: "s1", ids: ["s1", "s2"] };
  assert.equal(sessionBelongsToSlot({ id: "s1" }, merged), true);
  assert.equal(sessionBelongsToSlot({ id: "s2" }, merged), true);
  assert.equal(sessionBelongsToSlot({ id: "s3" }, merged), false);

  // A single-row slot carries no `ids` at all, and a planning meta matches nothing stored.
  assert.equal(sessionBelongsToSlot({ id: "s1" }, { id: "s1" }), true);
  assert.equal(sessionBelongsToSlot({ id: "s1" }, { id: "plan-x", isPlanning: true }), false);
  assert.equal(sessionBelongsToSlot({ id: "s1" }, null), false);
});
