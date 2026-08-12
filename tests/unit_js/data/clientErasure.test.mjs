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

test("the pseudonym identifies the record without describing the person", () => {
  // The exact format is not the contract — the three properties it must have are, and pinning the
  // literal string would fail on a cosmetic change while catching none of these.
  const jane = erasurePseudonym("c-jane-a");
  const marko = erasurePseudonym("c-marko-b");

  assert.notEqual(jane, marko, "two erased clients must stay distinguishable in a list");
  assert.equal(jane, erasurePseudonym("c-jane-a"), "stable: derived, never generated afresh");
  assert.ok(jane.trim().length > 0, "a record with no label cannot be worked with");
  // Nothing personal may leak in: the input is an opaque record id, and that is all it may reflect.
  for (const personal of ["Jane", "Doe", "jane@example.com"]) {
    assert.ok(!jane.toLowerCase().includes(personal.toLowerCase()));
  }
  // Even a record with no id at all gets a usable label rather than an empty one.
  assert.ok(erasurePseudonym("").trim().length > 0);
});

test("every identifying field on the client record is cleared", () => {
  const { state } = eraseClientInState(stateWithTwoJanes(), "c-jane-a", {
    requestedOn: "2026-08-01",
  });
  const erased = state.clients.find((client) => client.id === "c-jane-a");

  // Against the function, not a literal: what matters is that the record now carries the pseudonym
  // for THIS id, not what that pseudonym happens to spell.
  assert.equal(erased.name, erasurePseudonym("c-jane-a"));
  assert.ok(!erased.name.includes("Jane"), "the erased record must not still say their name");
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

  const pseudonym = erasurePseudonym("c-jane-a");
  assert.equal(state.history.find((record) => record.id === "h1").clientName, pseudonym);
  assert.equal(state.planUpdates.find((record) => record.id === "p1").clientName, pseudonym);
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

  const soloTitle = result.state.sessions.find((session) => session.id === "s-solo").title;
  assert.ok(!soloTitle.includes("Jane Doe"), "the name is gone from the title");
  assert.ok(soloTitle.includes(erasurePseudonym("c-jane-a")), "and the pseudonym stands in for it");
  assert.ok(soloTitle.includes("1:1"), "the rest of what the trainer typed survives");
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

  const pseudonym = erasurePseudonym("c-jane-a");
  assert.equal(record.feedback[0].note, `${pseudonym} flew through this`);
  assert.equal(record.title, `${pseudonym} — deload week`);
});

test("the disambiguator always says something, and prefers the trainer's own alias", () => {
  const [janeA, janeB] = stateWithTwoJanes().clients;

  // The alias comes first because it is the label the trainer chose FOR this purpose; the exact
  // separator is presentation, so only the ordering and the presence of each part are pinned.
  const labelA = clientDisambiguator(janeA);
  assert.ok(labelA.indexOf("morning") < labelA.indexOf("jane.a@example.com"));
  assert.match(clientDisambiguator(janeB), /jane\.b@example\.com/);
  // Even a record with nothing on it gets a label — an unlabelled option in a destructive
  // confirmation is how the wrong person gets erased.
  assert.ok(clientDisambiguator({ id: "c-abc123" }).trim().length > 0);
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
  // deepEqual, not identity: "returned the same object" is an implementation choice, "nobody's
  // record was touched" is the promise.
  assert.deepEqual(state, before);
});
