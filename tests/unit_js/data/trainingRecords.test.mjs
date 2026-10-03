// tests/unit_js/data/trainingRecords.test.mjs
// The one way code reads and writes trainings (src/data/trainingRecords.js). What a caller depends
// on: it reads programs and notes whatever shape is stored, and what it writes reads back.

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  addPendingNote,
  allExerciseNotes,
  allPrograms,
  discardPrograms,
  draftPrograms,
  feedbackFromNotes,
  groupsOfSessions,
  livePrograms,
  noteById,
  noteTagLine,
  notesForProgram,
  openProgramsOfSessions,
  pendingNotes,
  performedPrograms,
  programById,
  programDate,
  recordTrainings,
  removePendingNotes,
  resolveNote,
  saveSessionPrograms,
  unschedulePrograms,
  unscheduleRemovedClients,
} from "../../../src/data/trainingRecords.js";

function finished(id, clientId, date, extra = {}) {
  return {
    id,
    clientId,
    date,
    duration: 1800,
    exercises: [{ id: `${id}-1`, type: "exercise", name: "Plank", sets: [] }],
    feedback: [],
    ...extra,
  };
}

function draft(id, clientId, extra = {}) {
  return finished(id, clientId, "2026-09-20T09:00:00.000Z", {
    isPlanning: true,
    title: "Next week",
    ...extra,
  });
}

test("a client's performed programs come newest first, without drafts or other clients", () => {
  const state = {};
  recordTrainings(state, [
    finished("h1", "ana", "2026-09-01T10:00:00.000Z"),
    finished("h2", "ana", "2026-09-08T10:00:00.000Z"),
    finished("h3", "bojan", "2026-09-09T10:00:00.000Z"),
    draft("d1", "ana"),
  ]);
  assert.deepEqual(
    performedPrograms(state, "ana").map((program) => program.id),
    ["h2", "h1"],
  );
  assert.equal(performedPrograms(state).length, 3);
  assert.equal(programDate(programById(state, "h1")), "2026-09-01T10:00:00.000Z");
});

// One participant's program as the clipboard hands it to saveSessionPrograms.
function entry(id, clientId, extra = {}) {
  return {
    id,
    clientId,
    status: "planned",
    createdAt: "2026-09-20T09:00:00.000Z",
    routineId: "r1",
    routineName: "Strength",
    exercises: [
      {
        id: "plank",
        type: "exercise",
        name: "Plank",
        completed: false,
        sets: [{ reps: 1, weight: 0, completed: false, note: "" }],
      },
    ],
    feedback: [],
    ...extra,
  };
}

function loggedPlank() {
  return [
    {
      id: "plank",
      type: "exercise",
      name: "Plank",
      completed: true,
      sets: [{ reps: 1, weight: 0, completed: true, note: "" }],
    },
  ];
}

test("a draft is saved once and then updated in place, keeping its id", () => {
  const state = {};
  saveSessionPrograms(state, [entry("d1", "ana", { title: "Next week" })]);
  saveSessionPrograms(state, [entry("d1", "ana", { title: "Renamed" })]);
  assert.deepEqual(
    draftPrograms(state).map((program) => [program.id, program.title]),
    [["d1", "Renamed"]],
  );
});

test("a client with two drafts has the one named by id updated, not the other", () => {
  const state = {};
  saveSessionPrograms(state, [entry("d1", "ana", { title: "Next week" })]);
  saveSessionPrograms(state, [entry("d2", "ana", { title: "First" })]);
  saveSessionPrograms(state, [entry("d2", "ana", { title: "Second" })]);
  assert.deepEqual(
    draftPrograms(state)
      .map((program) => [program.id, program.title])
      .sort(),
    [
      ["d1", "Next week"],
      ["d2", "Second"],
    ],
  );
});

test("a draft never overwrites another client's draft or a performed program", () => {
  const state = {};
  recordTrainings(state, [finished("h1", "ana", "2026-09-01T10:00:00.000Z")]);
  saveSessionPrograms(state, [
    entry("d1", "ana", { title: "Ana draft" }),
    entry("d2", "bojan", { title: "Bojan draft" }),
  ]);
  assert.deepEqual(
    draftPrograms(state)
      .map((program) => [program.clientId, program.title])
      .sort(),
    [
      ["ana", "Ana draft"],
      ["bojan", "Bojan draft"],
    ],
  );
  assert.equal(programById(state, "h1").status, "done");
});

test("a saved draft keeps the notes the session holds on it", () => {
  const state = {};
  const note = {
    id: "n1",
    clientId: "ana",
    exerciseName: "Plank",
    tag: "Joint Pain / Discomfort",
    note: "wrist",
  };
  saveSessionPrograms(state, [entry("d1", "ana", { feedback: [note] })]);
  saveSessionPrograms(state, [entry("d1", "ana", { feedback: [note] })]);
  assert.deepEqual(
    notesForProgram(state, "d1").map((filed) => [filed.id, filed.text, filed.programItemId]),
    [["n1", "wrist", "plank"]],
  );
});

test("saving a live session twice keeps one program per participant", () => {
  const state = {};
  const live = { status: "live", sessionId: "s1", startedAt: "2026-09-20T18:00:00.000Z" };
  saveSessionPrograms(state, [entry("p1", "ana", live), entry("p2", "bojan", live)]);
  saveSessionPrograms(state, [
    entry("p1", "ana", { ...live, exercises: loggedPlank() }),
    entry("p2", "bojan", live),
  ]);
  assert.deepEqual(
    allPrograms(state)
      .map((program) => program.id)
      .sort(),
    ["p1", "p2"],
  );
  assert.equal(programById(state, "p1").exercises[0].sets[0].completed, true);
});

test("a live program reads back with its session, its start and its notes", () => {
  const state = {};
  const signal = {
    id: "n1",
    clientId: "ana",
    exerciseName: "Plank",
    tag: "Too Easy - Increase Load",
    note: "",
  };
  addPendingNote(state, {
    id: "n1",
    clientId: "ana",
    date: "2026-09-20T18:10:00.000Z",
    exerciseName: "Plank",
    tag: "Too Easy - Increase Load",
    resolved: false,
  });
  saveSessionPrograms(state, [
    entry("p1", "ana", {
      status: "live",
      sessionId: "s1",
      startedAt: "2026-09-20T18:00:00.000Z",
      exercises: loggedPlank(),
      feedback: [signal],
    }),
  ]);
  const [program] = openProgramsOfSessions(state, ["s1"]);
  assert.equal(program.id, "p1");
  assert.equal(program.status, "live");
  assert.equal(program.startedAt, "2026-09-20T18:00:00.000Z");
  assert.equal(program.performedAt, undefined);
  assert.deepEqual(livePrograms(state), [program]);
  assert.deepEqual(feedbackFromNotes(notesForProgram(state, "p1")), [signal]);
  // Filed on the program, and still waiting for the next plan.
  assert.deepEqual(
    pendingNotes(state).map((note) => note.programId),
    ["p1"],
  );
  assert.deepEqual(performedPrograms(state), []);
});

test("a note taken back goes, and a note a next plan waits for stays unfiled", () => {
  const state = {};
  const pain = {
    id: "n1",
    clientId: "ana",
    exerciseName: "Plank",
    tag: "Joint Pain / Discomfort",
    note: "",
  };
  const easy = {
    id: "n2",
    clientId: "ana",
    exerciseName: "Plank",
    tag: "Too Easy - Increase Load",
    note: "",
  };
  addPendingNote(state, {
    id: "n2",
    clientId: "ana",
    date: "2026-09-20T18:10:00.000Z",
    exerciseName: "Plank",
    tag: "Too Easy - Increase Load",
    resolved: false,
  });
  saveSessionPrograms(state, [entry("p1", "ana", { feedback: [pain, easy] })]);
  saveSessionPrograms(state, [entry("p1", "ana", { feedback: [] })]);
  assert.deepEqual(notesForProgram(state, "p1"), []);
  assert.equal(noteById(state, "n1"), null);
  assert.equal(noteById(state, "n2").review, "pending");
  assert.equal(noteById(state, "n2").programId, undefined);
});

test("finishing turns the live program into the done one, without a second program", () => {
  const state = { sessions: [{ id: "s1", participants: ["ana"] }] };
  saveSessionPrograms(state, [
    entry("p1", "ana", { status: "live", sessionId: "s1", startedAt: "2026-09-20T18:00:00.000Z" }),
  ]);
  recordTrainings(
    state,
    [finished("p1", "ana", "2026-09-20T18:00:00.000Z", { exercises: loggedPlank() })],
    { sessionIds: ["s1"] },
  );
  assert.equal(allPrograms(state).length, 1);
  const program = programById(state, "p1");
  assert.equal(program.status, "done");
  assert.equal(program.performedAt, "2026-09-20T18:00:00.000Z");
  assert.equal(program.startedAt, "2026-09-20T18:00:00.000Z");
  assert.equal(program.duration, 1800);
  assert.equal(program.sessionId, "s1");
  assert.deepEqual(openProgramsOfSessions(state, ["s1"]), []);
  assert.deepEqual(
    state.sessionAttendance.map((row) => [row.clientId, row.programId, row.status]),
    [["ana", "p1", "attended"]],
  );
});

test("two sessions' programs are kept side by side, each with its own groups", () => {
  const state = {};
  const inS1 = { status: "live", sessionId: "s1", startedAt: "2026-09-20T18:00:00.000Z" };
  const inS2 = { status: "live", sessionId: "s2", startedAt: "2026-09-20T18:30:00.000Z" };
  saveSessionPrograms(state, [entry("a1", "ana", inS1), entry("b1", "bojan", inS1)], {
    sessionId: "s1",
    groups: [["ana", "bojan"]],
  });
  saveSessionPrograms(state, [entry("c2", "cene", inS2)], { sessionId: "s2", groups: [] });
  saveSessionPrograms(state, [entry("a1", "ana", inS1), entry("b1", "bojan", inS1)], {
    sessionId: "s1",
    groups: [["ana", "bojan"]],
  });
  assert.deepEqual(
    openProgramsOfSessions(state, ["s1"])
      .map((program) => program.id)
      .sort(),
    ["a1", "b1"],
  );
  assert.deepEqual(
    openProgramsOfSessions(state, ["s2"]).map((program) => program.id),
    ["c2"],
  );
  // The one started last first.
  assert.equal(livePrograms(state)[0].id, "c2");
  assert.deepEqual(groupsOfSessions(state, ["s1"]), [["ana", "bojan"]]);
  assert.deepEqual(groupsOfSessions(state, ["s2"]), []);
  assert.equal(state.groupSharedPrograms.length, 1);
});

test("a group names its programs, and its id comes from them, never from its place in a list", () => {
  // Drive sync merges by id: an id from a position passed to the next group when one was removed.
  const state = {};
  const inS1 = { status: "live", sessionId: "s1", startedAt: "2026-09-20T18:00:00.000Z" };
  const four = [
    entry("a1", "ana", inS1),
    entry("b1", "bojan", inS1),
    entry("c1", "cene", inS1),
    entry("d1", "dora", inS1),
  ];
  saveSessionPrograms(state, four, {
    sessionId: "s1",
    groups: [
      ["ana", "bojan"],
      ["cene", "dora"],
    ],
  });
  const second = state.groupSharedPrograms.find((group) => group.programIds.includes("c1"));
  assert.deepEqual(second.programIds, ["c1", "d1"]);
  saveSessionPrograms(state, four, { sessionId: "s1", groups: [["cene", "dora"]] });
  assert.deepEqual(state.groupSharedPrograms, [second], "the group left keeps its id");
});

test("a plan for no session keeps its group", () => {
  const state = {};
  saveSessionPrograms(state, [entry("d1", "ana"), entry("d2", "bojan")], {
    groups: [["ana", "bojan"]],
  });
  assert.deepEqual(state.groupSharedPrograms[0].programIds, ["d1", "d2"]);
});

test("a plan thrown away is kept as discarded, listed nowhere, and the other session stays", () => {
  const state = {};
  const inS1 = { status: "live", sessionId: "s1", startedAt: "2026-09-20T18:00:00.000Z" };
  saveSessionPrograms(state, [entry("a1", "ana", inS1), entry("b1", "bojan", inS1)], {
    sessionId: "s1",
    groups: [["ana", "bojan"]],
  });
  saveSessionPrograms(state, [entry("c2", "cene", { sessionId: "s2" })], { sessionId: "s2" });
  discardPrograms(state, ["a1", "b1"]);
  assert.deepEqual(
    ["a1", "b1"].map((id) => programById(state, id)?.status),
    ["discarded", "discarded"],
  );
  assert.deepEqual(openProgramsOfSessions(state, ["s1"]), []);
  assert.deepEqual(livePrograms(state), []);
  assert.deepEqual(draftPrograms(state), []);
  assert.deepEqual(
    openProgramsOfSessions(state, ["s2"]).map((program) => program.id),
    ["c2"],
  );
});

test("a program taken off its session waits as a plan; an empty one is discarded; none is deleted", () => {
  const state = {};
  const live = { status: "live", sessionId: "s1", startedAt: "2026-09-20T18:00:00.000Z" };
  saveSessionPrograms(state, [
    entry("p1", "ana", live),
    entry("p2", "bojan", { ...live, exercises: [] }),
  ]);
  unschedulePrograms(state, ["p1", "p2"]);
  assert.equal(allPrograms(state).length, 2);
  const plan = programById(state, "p1");
  assert.equal(plan.status, "planned");
  assert.equal(plan.sessionId, undefined);
  assert.equal(plan.startedAt, undefined);
  assert.deepEqual(
    draftPrograms(state).map((program) => program.id),
    ["p1"],
  );
  assert.equal(programById(state, "p2").status, "discarded");
});

test("a pending note is listed until it is resolved, and is gone once removed", () => {
  const state = {};
  const update = {
    id: "n1",
    clientId: "ana",
    date: "2026-09-01T10:00:00.000Z",
    exerciseName: "Plank",
    tag: "Too Easy - Increase Load",
    resolved: false,
  };
  addPendingNote(state, update);
  assert.deepEqual(
    pendingNotes(state).map((note) => note.id),
    ["n1"],
  );

  resolveNote(state, "n1");
  assert.deepEqual(pendingNotes(state), []);
  assert.equal(noteById(state, "n1").review, "resolved");

  removePendingNotes(state, ["n1"]);
  assert.equal(noteById(state, "n1"), null);
});

test("pending notes come in the order they were taken, wherever each one is filed", () => {
  // One note is also filed in a finished program and one is not; the list still runs oldest first.
  const state = {};
  recordTrainings(state, [
    finished("h1", "ana", "2026-09-12T10:00:00.000Z", {
      feedback: [
        {
          id: "late",
          clientId: "ana",
          exerciseName: "Plank",
          tag: "Joint Pain / Discomfort",
          note: "",
        },
      ],
    }),
  ]);
  for (const [id, date] of [
    ["early", "2026-09-01T10:00:00.000Z"],
    ["late", "2026-09-12T10:00:00.000Z"],
  ]) {
    addPendingNote(state, {
      id,
      clientId: "ana",
      date,
      exerciseName: "Plank",
      tag: "Joint Pain / Discomfort",
      resolved: false,
    });
  }
  assert.deepEqual(
    pendingNotes(state).map((note) => note.id),
    ["early", "late"],
  );
});

test("a note filed in a finished program is found with that program", () => {
  const state = {};
  recordTrainings(state, [
    finished("h1", "ana", "2026-09-01T10:00:00.000Z", {
      feedback: [
        {
          id: "n1",
          clientId: "ana",
          exerciseName: "Plank",
          tag: "Joint Pain / Discomfort",
          note: "wrist",
        },
      ],
    }),
  ]);
  const [note] = notesForProgram(state, "h1");
  assert.equal(note.text, "wrist");
  assert.equal(note.programItemId, "h1-1");
  assert.equal(allExerciseNotes(state).length, 1);
});

test("a note's tag reads as the one line the feedback form stores, remark after the tag", () => {
  assert.equal(
    noteTagLine({ tag: "too_hard", text: "stopped at four" }),
    "Too Hard - Reduce Load - stopped at four",
  );
  assert.equal(noteTagLine({ tag: "too_easy" }), "Too Easy - Increase Load");
  assert.equal(noteTagLine(null), "");
});

test("a note stores the tag's id, never its English words", () => {
  const state = {};
  recordTrainings(state, [
    finished("h1", "ana", "2026-09-01T10:00:00.000Z", {
      feedback: [
        { id: "n1", clientId: "ana", exerciseName: "Plank", tag: "Too Easy - Increase Load" },
      ],
    }),
  ]);
  assert.equal(noteById(state, "n1").tag, "too_easy");
});

test("a program's notes come back as the feedback a live session keeps", () => {
  const state = {};
  recordTrainings(state, [
    finished("h1", "ana", "2026-09-01T10:00:00.000Z", {
      feedback: [
        {
          id: "n1",
          clientId: "ana",
          exerciseName: "Plank",
          tag: "Joint Pain / Discomfort",
          note: "wrist",
        },
      ],
    }),
  ]);
  assert.deepEqual(feedbackFromNotes(notesForProgram(state, "h1")), [
    {
      id: "n1",
      clientId: "ana",
      exerciseName: "Plank",
      tag: "Joint Pain / Discomfort",
      note: "wrist",
    },
  ]);
});

test("a program saved for a seeded session carries the seed stamp, notes included", () => {
  // Removing the sample data finds a program by this stamp, as it finds every other seeded record.
  const state = {};
  const note = {
    id: "n1",
    clientId: "ana",
    exerciseName: "Plank",
    tag: "Joint Pain / Discomfort",
    note: "",
  };
  saveSessionPrograms(state, [entry("p1", "ana", { testData: "test", feedback: [note] })]);
  assert.equal(programById(state, "p1").testData, "test");
  assert.equal(noteById(state, "n1").testData, "test");
});

test("a client taken off a booked session keeps their plan, unscheduled, and what they performed", () => {
  const plank = [{ id: "i1", type: "exercise", name: "Plank" }];
  const state = {
    clientPrograms: [
      { id: "p-ana", clientId: "ana", sessionId: "s1", status: "planned", exercises: plank },
      { id: "p-bor", clientId: "bor", sessionId: "s1", status: "planned", exercises: plank },
      { id: "p-cene", clientId: "cene", sessionId: "s1", status: "live", exercises: plank },
      { id: "p-other", clientId: "bor", sessionId: "s2", status: "planned", exercises: plank },
    ],
  };
  unscheduleRemovedClients(state, "s1", ["ana"]);
  assert.deepEqual(
    state.clientPrograms.map((program) => [program.id, program.status, program.sessionId]),
    [
      ["p-ana", "planned", "s1"],
      ["p-bor", "planned", undefined],
      ["p-cene", "live", "s1"],
      ["p-other", "planned", "s2"],
    ],
  );
});
