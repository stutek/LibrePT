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
    sessionSeries: [
      {
        id: "ser-solo",
        title: "Jane Doe Tuesdays",
        startDate: "2026-08-01",
        time: "18:00 - 19:00",
        weekdays: [2],
        participants: ["c-jane-a"],
      },
      {
        id: "ser-group",
        title: "Jane Doe + Marko strength",
        startDate: "2026-08-01",
        time: "19:00 - 20:00",
        weekdays: [4],
        participants: ["c-jane-a", "c-marko"],
      },
      {
        id: "ser-others",
        title: "Marko only",
        startDate: "2026-08-01",
        time: "07:00 - 08:00",
        weekdays: [1],
        participants: ["c-marko"],
      },
    ],
    sessions: [
      {
        id: "s-solo",
        participants: ["c-jane-a"],
        title: "Jane Doe 1:1",
        location: "Jane Doe's flat",
      },
      { id: "s-group", participants: ["c-jane-a", "c-marko"], title: "Jane Doe + Marko" },
      { id: "s-both-janes", participants: ["c-jane-a", "c-jane-b"], title: "Jane Doe pair" },
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
  for (const field of ["alias", "email", "phone", "goals", "notes", "injury"]) {
    assert.equal(erased[field], "", `${field} should be cleared`);
  }
  // The alias was kept until 2026-09-18 (TODO §59) and it is identifying on its own: the form asks
  // for a surname or a distinguishing detail, and it is drawn beside the name everywhere a client
  // is shown, so an erasure that left it named the person the pseudonym is there to hide.
  assert.ok(!JSON.stringify(erased).includes("morning"), "no trace of the trainer's own label");
  // Body weight measures the person, not the work — see CLEARED_TEXT_FIELDS' comment.
  assert.deepEqual(erased.weightHistory, []);
  assert.equal(erased.active, false);
  assert.equal(erased.erasure.requestedOn, "2026-08-01");
  assert.ok(isErased(erased));
  // Consent survives: it identifies nobody and is the trainer's Art. 7(1) evidence.
  assert.equal(erased.gdprConsent.consentDate, "2026-01-05");
});

test("a repeating rule for this client alone is dropped, a shared one is kept without them", () => {
  // Ruled 2026-09-19 (Simon, TODO §65): a rule that exists for one client exists only to keep
  // producing their evenings, and an erased person must not still be scheduled every week. A rule
  // with other people in it belongs to those others.
  const { state, summary } = eraseClientInState(stateWithTwoJanes(), "c-jane-a", {});
  const ids = state.sessionSeries.map((series) => series.id);

  assert.deepEqual(ids, ["ser-group", "ser-others"], "the one-to-one rule is gone");
  assert.equal(summary.seriesRemoved, 1);
  assert.equal(summary.seriesKept, 1);

  const group = state.sessionSeries.find((series) => series.id === "ser-group");
  assert.deepEqual(group.participants, ["c-marko"], "only the erased client leaves the rule");
  // Marko is not a namesake, so the rule's title is rewritten even though another Jane exists
  // elsewhere in the book: she is not in this rule, so it cannot be about her.
  assert.ok(!group.title.includes("Jane"), group.title);
  assert.deepEqual(summary.reviewSeriesIds, []);
});

test("a rule the two same-named clients share keeps its title and is reported", () => {
  const state = stateWithTwoJanes();
  state.sessionSeries.push({
    id: "ser-two-janes",
    title: "Jane Doe pair",
    startDate: "2026-08-01",
    time: "20:00 - 21:00",
    weekdays: [3],
    participants: ["c-jane-a", "c-jane-b"],
  });

  const { state: erased, summary } = eraseClientInState(state, "c-jane-a", {});
  const shared = erased.sessionSeries.find((series) => series.id === "ser-two-janes");

  // Both Janes are in this one, so the name in its title could mean either.
  assert.equal(shared.title, "Jane Doe pair");
  assert.deepEqual(shared.participants, ["c-jane-b"]);
  assert.deepEqual(summary.reviewSeriesIds, ["ser-two-janes"]);
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

test("text is judged on the record it sits on, not on the whole book", () => {
  // Ruled 2026-09-19 (Simon): check the context. A namesake who is not on this record cannot be who
  // the text means, so only a record holding BOTH Janes is left alone.
  const { state, summary } = eraseClientInState(stateWithTwoJanes(), "c-jane-a", {});
  const marker = "[c-jane-a]";

  const solo = state.sessions.find((session) => session.id === "s-solo");
  assert.equal(solo.title, `${marker} 1:1`);
  assert.equal(solo.location, `${marker}'s flat`, "a location names a person just as a title does");
  assert.equal(
    state.sessions.find((session) => session.id === "s-group").title,
    `${marker} + Marko`,
  );
  // Both Janes are on this one, and the other did not ask to be forgotten.
  assert.equal(
    state.sessions.find((session) => session.id === "s-both-janes").title,
    "Jane Doe pair",
  );
  assert.deepEqual(summary.reviewSessionIds, ["s-both-janes"]);
  assert.equal(summary.namesakes.length, 1);
  assert.match(summary.namesakes[0].label, /jane\.b@example\.com/);
});

test("what stands in for the name is the record's own id, in brackets", () => {
  // Ruled 2026-09-19 (Simon). The id is already in the record and says nothing about the person, so
  // the text shows WHICH client was taken out — and two erased clients in one sentence stay two.
  const result = eraseClientInState(stateWithTwoJanes(), "c-jane-a", {});
  const soloTitle = result.state.sessions.find((session) => session.id === "s-solo").title;

  assert.ok(!soloTitle.includes("Jane Doe"), "the name is gone from the title");
  assert.ok(soloTitle.includes("[c-jane-a]"), `the id stands in for it: ${soloTitle}`);
  assert.ok(soloTitle.includes("1:1"), "the rest of what the trainer typed survives");
  // The record's own label stays the short pseudonym, which is what a trainer reads in a list.
  const erased = result.state.clients.find((client) => client.id === "c-jane-a");
  assert.equal(erased.name, erasurePseudonym("c-jane-a"));
});

test("prose inside the client's OWN records is rewritten even with a namesake present", () => {
  // A feedback note on Jane A's session is unambiguously about Jane A — ambiguity only reaches
  // records that several clients share.
  const { state } = eraseClientInState(stateWithTwoJanes(), "c-jane-a", {});
  const record = state.history.find((entry) => entry.id === "h1");

  assert.equal(record.feedback[0].note, "[c-jane-a] flew through this");
  assert.equal(record.title, "[c-jane-a] — deload week");
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
