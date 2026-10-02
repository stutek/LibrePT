// tests/unit_js/data/sessionModelConversion.test.mjs
// The old shape of a training to the new session model and back (src/data/sessionModelConversion.js).
//
// What a trainer would lose if these broke: a past session shown twice after restoring an old
// backup again, a group training split into strangers, a plan update that comes back after it was
// dealt with, or a record that an older build on the same phone no longer shows.

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  historyFromSessionModel,
  matchingSession,
  sessionModelFromHistory,
} from "../../../src/data/sessionModelConversion.js";

const SQUAT = { id: "ex-squat", name: "Back Squat" };
const PLANK = { id: "ex-plank", name: "Plank" };

function performed(id, clientId, extra = {}) {
  return {
    id,
    clientId,
    clientName: clientId,
    routineId: "r-legs",
    routineName: "Legs",
    date: "2026-09-10T16:05:00.000Z",
    duration: 3000,
    exercises: [
      {
        id: `${id}-squat`,
        type: "exercise",
        position: 0,
        name: "Back Squat",
        sets: [{ reps: 5, weight: 60, completed: true, note: "" }],
      },
    ],
    feedback: [],
    ...extra,
  };
}

function groupEvening(extra = {}) {
  return {
    id: "s-tue",
    startDate: "2026-09-10T16:00:00.000Z",
    participants: ["ana", "bojan", "cene"],
    routineId: "r-legs",
    completed: true,
    ...extra,
  };
}

const clients = ["ana", "bojan", "cene"].map((id) => ({ id, name: id }));

test("a group training finds its one session, and each client gets a program and attendance", () => {
  const history = [performed("h-ana", "ana"), performed("h-bojan", "bojan")];
  const model = sessionModelFromHistory({
    history,
    sessions: [groupEvening()],
    exercises: [SQUAT],
  });

  assert.deepEqual(
    model.clientPrograms.map((program) => [program.id, program.sessionId, program.status]),
    [
      ["h-ana", "s-tue", "done"],
      ["h-bojan", "s-tue", "done"],
    ],
  );
  assert.deepEqual(
    model.sessionAttendance.map((row) => [row.clientId, row.status, row.consumesQuota]),
    [
      ["ana", "attended", true],
      ["bojan", "attended", true],
    ],
  );
  assert.equal(model.clientPrograms[0].exercises[0].exerciseId, "ex-squat");
  // Cene was on the session and has no record: nothing says whether they came.
  assert.equal(
    model.sessionAttendance.some((row) => row.clientId === "cene"),
    false,
  );
});

test("a session that was not finished, or was cancelled, or on another day, is not matched", () => {
  const record = performed("h-ana", "ana");
  for (const session of [
    groupEvening({ completed: false }),
    groupEvening({ cancelled: true }),
    groupEvening({ startDate: "2026-09-11T16:00:00.000Z" }),
    groupEvening({ participants: ["bojan"] }),
  ]) {
    assert.equal(matchingSession(record, [session]), null, JSON.stringify(session));
  }
});

test("two sessions that fit are narrowed by the routine, and left alone when that does not decide", () => {
  const record = performed("h-ana", "ana");
  const legs = groupEvening({ id: "s-legs" });
  const arms = groupEvening({ id: "s-arms", routineId: "r-arms" });
  assert.equal(matchingSession(record, [legs, arms])?.id, "s-legs");

  const legsAgain = groupEvening({ id: "s-legs-2" });
  assert.equal(matchingSession(record, [legs, legsAgain]), null);
});

test("the routine is recognised by most of the record's exercises when its id and name differ", () => {
  const record = performed("h-ana", "ana", { routineId: undefined, routineName: "Renamed" });
  const routines = [
    { id: "r-legs", name: "Legs", exercises: [{ name: "Back Squat" }] },
    { id: "r-arms", name: "Arms", exercises: [{ name: "Curl" }] },
  ];
  const legs = groupEvening({ id: "s-legs" });
  const arms = groupEvening({ id: "s-arms", routineId: "r-arms" });
  assert.equal(matchingSession(record, [legs, arms], routines)?.id, "s-legs");
});

test("a training without a booked session keeps its program, with no session and no attendance", () => {
  const model = sessionModelFromHistory({ history: [performed("h-ana", "ana")], sessions: [] });
  assert.equal(model.clientPrograms[0].sessionId, undefined);
  assert.equal(model.clientPrograms[0].performedAt, "2026-09-10T16:05:00.000Z");
  assert.deepEqual(model.sessionAttendance, []);
});

test("a planning draft becomes a planned program with no session", () => {
  const draft = performed("h-draft", "ana", {
    isPlanning: true,
    title: "Deload",
    date: "2026-09-12T08:00:00.000Z",
  });
  const [program] = sessionModelFromHistory({
    history: [draft],
    sessions: [groupEvening()],
  }).clientPrograms;
  assert.equal(program.status, "planned");
  assert.equal(program.sessionId, undefined);
  assert.equal(program.createdAt, "2026-09-12T08:00:00.000Z");
  assert.equal(program.title, "Deload");
});

test("a feedback item and its plan update are one note, linked to the exercise it was about", () => {
  const record = performed("h-ana", "ana", {
    feedback: [
      {
        id: "n1",
        clientId: "ana",
        exerciseName: "Back Squat",
        tag: "Too Easy - Increase Load",
        note: "flew",
      },
    ],
  });
  const update = {
    id: "n1",
    clientId: "ana",
    date: "2026-09-10T16:30:00.000Z",
    exerciseName: "Back Squat",
    tag: "Too Easy - Increase Load - flew",
    resolved: true,
  };
  const { exerciseNotes } = sessionModelFromHistory({
    history: [record],
    planUpdates: [update],
    exercises: [SQUAT],
  });

  assert.deepEqual(exerciseNotes, [
    {
      id: "n1",
      clientId: "ana",
      programId: "h-ana",
      programItemId: "h-ana-squat",
      exerciseId: "ex-squat",
      exerciseName: "Back Squat",
      createdAt: "2026-09-10T16:30:00.000Z",
      tag: "Too Easy - Increase Load",
      text: "flew",
      resolved: true,
    },
  ]);
});

test("a plan update written outside a session is a note the next plan acts on", () => {
  const { exerciseNotes } = sessionModelFromHistory({
    planUpdates: [
      {
        id: "u1",
        clientId: "ana",
        date: "2026-09-01T10:00:00.000Z",
        exerciseName: "Plank",
        tag: "Pain",
        resolved: false,
      },
    ],
    exercises: [PLANK],
  });
  assert.equal(exerciseNotes[0].resolved, false);
  assert.equal(exerciseNotes[0].exerciseId, "ex-plank");
  assert.equal(exerciseNotes[0].programId, undefined);
});

test("every item gets an id of its own; one it already had is kept where it is unique", () => {
  const record = performed("h-ana", "ana", {
    exercises: [
      { id: "row-1", type: "exercise", name: "Back Squat" },
      { type: "rest", rest: 60 },
      { id: "dup", type: "exercise", name: "Plank" },
      { id: "dup", type: "exercise", name: "Plank" },
    ],
  });
  const [program] = sessionModelFromHistory({ history: [record] }).clientPrograms;
  assert.deepEqual(
    program.exercises.map((item) => item.id),
    ["row-1", "h-ana-1", "h-ana-2", "h-ana-3"],
  );
});

test("converting the same data twice gives the same records", () => {
  const input = {
    history: [performed("h-ana", "ana"), performed("h-bojan", "bojan")],
    planUpdates: [{ id: "u1", clientId: "ana", tag: "Pain", resolved: false }],
    sessions: [groupEvening()],
    exercises: [SQUAT],
  };
  assert.deepEqual(sessionModelFromHistory(input), sessionModelFromHistory(input));
});

test("back to the old shape, nothing an older build shows is lost or changed", () => {
  const history = [
    performed("h-ana", "ana", {
      feedback: [
        { id: "n1", clientId: "ana", exerciseName: "Back Squat", tag: "Too Easy", note: "" },
        { id: "n2", clientId: "ana", exerciseName: "Back Squat", tag: "Pain", note: "left knee" },
      ],
    }),
    performed("h-draft", "bojan", {
      isPlanning: true,
      title: "Deload",
      duration: 0,
      date: "2026-09-12T08:00:00.000Z",
    }),
  ];
  const planUpdates = [
    {
      id: "n1",
      clientId: "ana",
      clientName: "ana",
      date: "2026-09-10T16:30:00.000Z",
      exerciseName: "Back Squat",
      tag: "Too Easy",
      resolved: false,
    },
    {
      id: "n2",
      clientId: "ana",
      clientName: "ana",
      date: "2026-09-10T16:31:00.000Z",
      exerciseName: "Back Squat",
      tag: "Pain - left knee",
      resolved: true,
    },
    {
      id: "u-outside",
      clientId: "cene",
      clientName: "cene",
      date: "2026-09-01T10:00:00.000Z",
      exerciseName: "Plank",
      tag: "Pain - wrist",
      resolved: false,
    },
  ];
  const model = sessionModelFromHistory({
    history,
    planUpdates,
    sessions: [groupEvening()],
    exercises: [SQUAT, PLANK],
  });
  const back = historyFromSessionModel({ ...model, clients });

  assert.deepEqual(back.history, history);
  assert.deepEqual(back.planUpdates, planUpdates);
});

test("a note that only recorded what happened does not come back as a plan update", () => {
  // Its plan update was dealt with and removed; the copy inside the history record stayed.
  const record = performed("h-ana", "ana", {
    feedback: [
      { id: "n1", clientId: "ana", exerciseName: "Back Squat", tag: "Too Easy", note: "" },
    ],
  });
  const model = sessionModelFromHistory({ history: [record] });
  assert.deepEqual(historyFromSessionModel({ ...model, clients }).planUpdates, []);
});

test("a demo training stays marked as demo data, so removing the demo data still finds it", () => {
  const record = performed("h-ana", "ana", {
    testData: "demo",
    feedback: [
      { id: "n1", clientId: "ana", exerciseName: "Back Squat", tag: "Too Easy", note: "" },
    ],
  });
  const update = { id: "u1", clientId: "ana", tag: "Pain", resolved: false, testData: "demo" };
  const model = sessionModelFromHistory({
    history: [record],
    planUpdates: [update],
    sessions: [groupEvening()],
  });
  for (const [collection, rows] of Object.entries(model)) {
    for (const row of rows) assert.equal(row.testData, "demo", `${collection} ${row.id}`);
  }
  const back = historyFromSessionModel({ ...model, clients });
  assert.equal(back.history[0].testData, "demo");
  assert.equal(back.planUpdates[0].testData, "demo");
});

test("a feedback item written without an id is kept, under the same id every time", () => {
  const record = performed("h-ana", "ana", {
    feedback: [{ clientId: "ana", exerciseName: "Back Squat", tag: "Pain", note: "knee" }],
  });
  const first = sessionModelFromHistory({ history: [record] }).exerciseNotes;
  const second = sessionModelFromHistory({ history: [record] }).exerciseNotes;
  assert.equal(first.length, 1);
  assert.equal(first[0].text, "knee");
  assert.deepEqual(first, second);
});

test("a session in progress, or a booked one being planned, is not written into an older build's history", () => {
  const live = { id: "p-live", clientId: "ana", status: "live", sessionId: "s1", exercises: [] };
  const booked = {
    id: "p-booked",
    clientId: "ana",
    status: "planned",
    sessionId: "s1",
    exercises: [],
  };
  const draft = { id: "p-draft", clientId: "ana", status: "planned", exercises: [] };
  assert.deepEqual(
    historyFromSessionModel({ clientPrograms: [live, booked, draft], clients }).history.map(
      (r) => r.id,
    ),
    ["p-draft"],
    "only the plan written for no session is an unscheduled plan",
  );
});
