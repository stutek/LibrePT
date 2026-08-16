// tests/unit_js/data/trainerIdentity.test.mjs
// The trainer's own address, kept only so an invite has an ORGANIZER (src/data/trainerIdentity.js).

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  looksLikeEmail,
  readTrainerIdentity,
  writeTrainerIdentity,
} from "../../../src/data/trainerIdentity.js";

/** The `store` injection point exists for exactly this — no browser, no globals to reset. */
function fakeStore(initial = {}) {
  const values = { ...initial };
  return {
    getItem: (key) => (key in values ? values[key] : null),
    setItem: (key, value) => {
      values[key] = value;
    },
    removeItem: (key) => {
      delete values[key];
    },
    values,
  };
}

test("what was stored is what comes back", () => {
  const store = fakeStore();
  writeTrainerIdentity({ name: "Sam Ray", email: "pt@librept.test" }, store);
  assert.deepEqual(readTrainerIdentity(store), { name: "Sam Ray", email: "pt@librept.test" });
});

test("an install that has never been told reports empty strings, not null", () => {
  // The invite dialog puts this straight into an input's value; null would render as "null".
  assert.deepEqual(readTrainerIdentity(fakeStore()), { name: "", email: "" });
});

test("clearing the field forgets the address rather than storing a blank one", () => {
  const store = fakeStore();
  writeTrainerIdentity({ email: "pt@librept.test" }, store);
  writeTrainerIdentity({ email: "   " }, store);
  assert.deepEqual(readTrainerIdentity(store), { name: "", email: "" });
  assert.equal(Object.keys(store.values).length, 0, "no empty key left behind");
});

test("surrounding whitespace never reaches the invite", () => {
  // It would land inside `mailto:` in the .ics, where a calendar client is entitled to reject it.
  const store = fakeStore();
  writeTrainerIdentity({ email: "  pt@librept.test  " }, store);
  assert.equal(readTrainerIdentity(store).email, "pt@librept.test");
});

test("an obvious non-address is rejected before it can be stored", () => {
  assert.ok(looksLikeEmail("pt@librept.test"));
  assert.equal(looksLikeEmail("pt@librept"), false, "no dot in the domain");
  assert.equal(looksLikeEmail("not an address"), false);
  assert.equal(looksLikeEmail(""), false);
  assert.equal(looksLikeEmail(undefined), false);
});
