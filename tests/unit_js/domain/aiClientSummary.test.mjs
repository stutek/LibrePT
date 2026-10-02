// tests/unit_js/domain/aiClientSummary.test.mjs
// The client summary copied for an AI assistant (src/domain/aiClientSummary.js): what goes into it,
// and above all what does not.

import assert from "node:assert/strict";
import { test } from "node:test";
import { aiClientSummary } from "../../../src/domain/aiClientSummary.js";

const client = {
  id: "c1a9f0e2",
  name: "Ana Kovač",
  email: "ana@example.com",
  phone: "+386 40 111 222",
  goals: "Ana wants to run a half marathon",
  notes: "Ana has a sensitive left knee",
};
// The client's programs as data/trainingRecords.js reads them.
const history = [
  {
    id: "h1",
    clientId: "c1a9f0e2",
    status: "done",
    performedAt: "2026-09-20T08:00:00.000Z",
    exercises: [
      {
        id: "e1",
        name: "Barbell Back Squat",
        sets: [
          { reps: 10, weight: 40, completed: true },
          { reps: 8, weight: 40, completed: true },
        ],
      },
      { id: "e2", name: "Plank", completed: false, sets: [] },
    ],
  },
  { id: "p1", clientId: "c1a9f0e2", status: "planned", createdAt: "2026-09-27", exercises: [] },
  {
    id: "h2",
    clientId: "someone-else",
    status: "done",
    performedAt: "2026-09-21",
    exercises: [],
  },
];

test("the free text a trainer typed never goes into the copy", () => {
  // Goals and notes are where a client's name is written, and notes hold injuries — health data.
  const summary = aiClientSummary(client, history);
  for (const text of [client.name, "Ana", client.email, client.phone, client.goals, client.notes]) {
    assert.equal(summary.includes(text), false, text);
  }
});

test("the copy carries the client's ID and what they did, set by set", () => {
  // It read a field workout records do not have, so no workout ever reached the copy.
  const summary = aiClientSummary(client, history);
  assert.match(summary, /#c1a9f0e2/);
  assert.match(summary, /2026-09-20/);
  assert.match(summary, /Barbell Back Squat: 10 @ 40 kg, 8 @ 40 kg/);
  assert.match(summary, /Plank: skipped/);
});

test("only this client's performed sessions count, never a planning draft", () => {
  assert.match(aiClientSummary(client, history), /Logged sessions: 1/);
});
