// tests/unit_js/domain/clientNameWords.test.mjs
// Keeping a client's name out of a session's name and location (TODO §66,
// src/domain/clientNameWords.js). Ruled 2026-09-18 (Simon): whole words only, from names, surnames
// and aliases, and the save is refused.
//
// Pure logic, so Node rather than a browser: what the form does with the answer is a component test.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SHORTEST_BLOCKED_WORD,
  clientNameWords,
  clientNamesIn,
} from "../../../src/domain/clientNameWords.js";

const clients = [
  { id: "c1", name: "Ana Novak", alias: "morning" },
  { id: "c2", name: "Jane Doe" },
  { id: "c3", name: "Ed Ng" },
];

test("a name, a surname and an alias each block a title that uses them", () => {
  const words = clientNameWords(clients);

  assert.deepEqual(clientNamesIn("Ana 1:1", words), ["Ana"]);
  assert.deepEqual(clientNamesIn("Novak deload", words), ["Novak"]);
  assert.deepEqual(clientNamesIn("morning group", words), ["morning"]);
  // Quoted back as the trainer typed it, so the message can show their own word.
  assert.deepEqual(clientNamesIn("ANA and jane", words), ["ANA", "jane"]);
});

test("whole words only", () => {
  const words = clientNameWords(clients);

  // The rule Simon set: a name inside a longer word is not the name.
  assert.deepEqual(clientNamesIn("Banana session", words), []);
  assert.deepEqual(clientNamesIn("Doehring hall", words), []);
  // Punctuation is a boundary, so a possessive or a colon does not smuggle it through.
  assert.deepEqual(clientNamesIn("Jane's flat", words), ["Jane"]);
  assert.deepEqual(clientNamesIn("Strength:Ana", words), ["Ana"]);
});

test("case and accents do not get around it", () => {
  const words = clientNameWords([{ id: "c1", name: "Nováková" }]);

  assert.deepEqual(clientNamesIn("novakova morning", words), ["novakova"]);
});

test("a word shorter than the floor is not blocked", () => {
  const words = clientNameWords(clients);

  // "Ed" and "Ng" would stop ordinary titles, and a trainer who cannot save cannot start a session.
  assert.equal(SHORTEST_BLOCKED_WORD, 3);
  assert.deepEqual(clientNamesIn("Ed and Ng", words), []);
  assert.equal(words.has("ed"), false);
});

test("an erased client's pseudonym is not blocked", () => {
  // It names nobody, and blocking it would refuse a string the trainer cannot even read.
  const words = clientNameWords([
    { id: "c1", name: "Client 4f2a9c", erasure: { erasedAt: "2026-09-01T10:00:00.000Z" } },
  ]);

  assert.deepEqual(clientNamesIn("Client 4f2a9c", words), []);
});

test("no clients, no blocking", () => {
  assert.deepEqual(clientNamesIn("Anything at all", clientNameWords([])), []);
});
