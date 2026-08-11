// tests/unit_js/data/clientErasure.test.mjs
// Erasure as anonymization (src/data/clientErasure.js) — pure state-in/state-out, no DOM.
//
// The tests that matter most are not "the name was removed" but the two ways this can go wrong
// silently: a DENORMALISED copy of the name left behind in another collection (history and
// planUpdates both carry `clientName`), and a same-named client's records being rewritten as
// collateral damage. Both produce a database that looks erased and is not, or a second client whose
// records were quietly edited under someone else's request.

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  clientDisambiguator,
  clientsSharingName,
  eraseClientInState,
  erasurePseudonym,
  isErased,
} from "../../../src/data/clientErasure.js";

function stateWithTwoJanes() {
  return {
    clients: [
      {
        id: "c-jane-a",
        name: "Jane Doe",
        alias: "morning",
        email: "jane.a@example.com",
        phone: "+386 40 111 111",
        goals: "Squat 100kg",
        notes: "Left knee pain since March",
        injury: "L4 disc",
        weightHistory: [{ date: "2026-01-01", kg: 64 }],
        active: true,
        gdprConsent: { cloudSync: true, consentDate: "2026-01-05", formVersion: "2026-08-09" },
      },
      { id: "c-jane-b", name: "Jane Doe", email: "jane.b@example.com", active: true },
      { id: "c-marko", name: "Marko Novak", active: true },
    ],
    history: [
      {
        id: "h1",
        clientId: "c-jane-a",
        clientName: "Jane Doe",
        title: "Jane Doe — deload week",
        exercises: [],
        feedback: [{ id: "f1", tag: "Too Easy", note: "Jane Doe flew through this" }],
      },
      { id: "h2", clientId: "c-jane-b", clientName: "Jane Doe", exercises: [] },
    ],
    planUpdates: [
      { id: "p1", clientId: "c-jane-a", clientName: "Jane Doe", resolved: false },
      { id: "p2", clientId: "c-marko", clientName: "Marko Novak", resolved: false },
    ],
    sessions: [
      { id: "s-solo", participants: ["c-jane-a"], title: "Jane Doe 1:1" },
      { id: "s-group", participants: ["c-jane-a", "c-marko"], title: "Jane Doe + Marko" },
      { id: "s-other", participants: ["c-marko"], title: "Marko only" },
    ],
  };
}

test("the pseudonym is derived from the opaque id, so nothing new has to be stored", () => {
  // A stored mapping is the thing that would make erasure reversible — see the module header.
  assert.equal(erasurePseudonym("c-jane-a"), "Client #JANE-A");
  assert.equal(erasurePseudonym(""), "Client #ERASED");
});

test("every identifying field on the client record is cleared", () => {
  const { state } = eraseClientInState(stateWithTwoJanes(), "c-jane-a", {
    requestedOn: "2026-08-01",
  });
  const erased = state.clients.find((client) => client.id === "c-jane-a");

  assert.equal(erased.name, "Client #JANE-A");
  for (const field of ["email", "phone", "goals", "notes", "injury"]) {
    assert.equal(erased[field], "", `${field} should be cleared`);
  }
  // Body weight measures the person, not the work — see CLEARED_TEXT_FIELDS' comment.
  assert.deepEqual(erased.weightHistory, []);
  assert.equal(erased.active, false);
  assert.equal(erased.erasure.requestedOn, "2026-08-01");
  assert.ok(isErased(erased));
  // Consent survives: it identifies nobody and is the trainer's Art. 7(1) evidence.
  assert.equal(erased.gdprConsent.consentDate, "2026-01-05");
});

test("the denormalised name copies are rewritten too", () => {
  // DATA_MODEL §5: "if one store keeps the name, the erasure has failed".
  const { state } = eraseClientInState(stateWithTwoJanes(), "c-jane-a", {});

  assert.equal(state.history.find((record) => record.id === "h1").clientName, "Client #JANE-A");
  assert.equal(state.planUpdates.find((record) => record.id === "p1").clientName, "Client #JANE-A");
});

test("another client with the same name is left completely untouched", () => {
  const before = stateWithTwoJanes();
  const { state } = eraseClientInState(before, "c-jane-a", {});

  const janeB = state.clients.find((client) => client.id === "c-jane-b");
  assert.equal(janeB.name, "Jane Doe");
  assert.equal(janeB.email, "jane.b@example.com");
  // Their history record still carries their own name, not the other Jane's pseudonym.
  assert.equal(state.history.find((record) => record.id === "h2").clientName, "Jane Doe");
});

test("shared free text is flagged, never rewritten, when the name is ambiguous", () => {
  const { state, summary } = eraseClientInState(stateWithTwoJanes(), "c-jane-a", {});

  // A namesake exists, so no session title is rewritten — the regex cannot tell which Jane a title
  // means, and guessing would edit the other client's session under this client's request.
  assert.equal(state.sessions.find((session) => session.id === "s-solo").title, "Jane Doe 1:1");
  assert.equal(
    state.sessions.find((session) => session.id === "s-group").title,
    "Jane Doe + Marko",
  );
  assert.deepEqual(summary.reviewSessionIds, ["s-solo", "s-group"]);
  assert.equal(summary.namesakes.length, 1);
  assert.match(summary.namesakes[0].label, /jane\.b@example\.com/);
});

test("with no namesake, a solo session title is rewritten and a group one is not", () => {
  const state = stateWithTwoJanes();
  state.clients = state.clients.filter((client) => client.id !== "c-jane-b");
  state.history = state.history.filter((record) => record.id !== "h2");

  const result = eraseClientInState(state, "c-jane-a", {});

  assert.equal(
    result.state.sessions.find((session) => session.id === "s-solo").title,
    "Client #JANE-A 1:1",
  );
  // A group title may mean any participant, and the others did not ask to be forgotten.
  assert.equal(
    result.state.sessions.find((session) => session.id === "s-group").title,
    "Jane Doe + Marko",
  );
  assert.deepEqual(result.summary.reviewSessionIds, ["s-group"]);
});

test("prose inside the client's OWN records is rewritten even with a namesake present", () => {
  // A feedback note on Jane A's session is unambiguously about Jane A — ambiguity only reaches
  // records that several clients share.
  const { state } = eraseClientInState(stateWithTwoJanes(), "c-jane-a", {});
  const record = state.history.find((entry) => entry.id === "h1");

  assert.equal(record.feedback[0].note, "Client #JANE-A flew through this");
  assert.equal(record.title, "Client #JANE-A — deload week");
});

test("the disambiguator always says something, and prefers the trainer's own alias", () => {
  const [janeA, janeB] = stateWithTwoJanes().clients;

  assert.match(clientDisambiguator(janeA), /^morning · jane\.a@example\.com/);
  assert.match(clientDisambiguator(janeB), /jane\.b@example\.com/);
  // Even a record with nothing on it gets a label — an unlabelled option in a destructive
  // confirmation is how the wrong person gets erased.
  assert.match(clientDisambiguator({ id: "c-abc123" }), /id …c-abc123|id …abc123/);
});

test("namesakes are matched on a normalised name, not an exact string", () => {
  const state = stateWithTwoJanes();
  state.clients[1].name = "  jane   DOE ";

  assert.equal(clientsSharingName(state, state.clients[0]).length, 1);
});

test("erasing an unknown client changes nothing at all", () => {
  const before = stateWithTwoJanes();
  const { state, summary } = eraseClientInState(before, "c-nobody", {});

  assert.equal(summary, null);
  assert.equal(state, before);
});
