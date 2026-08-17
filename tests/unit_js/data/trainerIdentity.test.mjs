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

  // Field by field, not deepEqual against the whole object: the shape is not the contract, the
  // round trip is (AGENT_RULES §5.8). Pinning the shape meant that adding `phone` — a real field
  // with its own tests, breaking nothing a caller can observe — failed three tests here.
  const identity = readTrainerIdentity(store);
  assert.equal(identity.name, "Sam Ray");
  assert.equal(identity.email, "pt@librept.test");
});

test("an install that has never been told reports empty strings, not null", () => {
  // The invite dialog puts these straight into an input's value; null would render as "null". That
  // holds for every field this returns, so it is asserted over all of them rather than a fixed list.
  for (const [field, value] of Object.entries(readTrainerIdentity(fakeStore()))) {
    assert.equal(value, "", `${field} should be an empty string on a fresh install`);
  }
});

test("clearing the field forgets the address rather than storing a blank one", () => {
  const store = fakeStore();
  writeTrainerIdentity({ email: "pt@librept.test" }, store);
  writeTrainerIdentity({ email: "   " }, store);
  assert.equal(readTrainerIdentity(store).email, "");
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

// --- The trainer's phone (TODO §1.6, SMS ruled in 2026-08-17). Kept for one reason: an invite has to
// carry it, or the client's reply can only ever be an email — their device knows nothing about the
// trainer except what the invite told it. ---

test("a phone is remembered so an invite can carry it", () => {
  const store = fakeStore();

  writeTrainerIdentity(
    { name: "Sam Ray", email: "pt@example.com", phone: "+386 41 234 567" },
    store,
  );

  assert.equal(readTrainerIdentity(store).phone, "+386 41 234 567");
});

test("a trainer who gives no phone is not reported as having one", () => {
  const store = fakeStore();

  writeTrainerIdentity({ name: "Sam Ray", email: "pt@example.com" }, store);

  // "" rather than undefined, matching name and email: every caller already treats falsy as absent,
  // and a second shape for the same idea is how one branch ends up offering an SMS to nobody.
  assert.equal(readTrainerIdentity(store).phone, "");
});

test("clearing the phone removes it rather than storing a blank", () => {
  const store = fakeStore();
  writeTrainerIdentity({ email: "pt@example.com", phone: "+386 41 234 567" }, store);

  writeTrainerIdentity({ email: "pt@example.com", phone: "  " }, store);

  assert.equal(readTrainerIdentity(store).phone, "");
  // The email survived: writing one field must not clear the others a trainer already gave.
  assert.equal(readTrainerIdentity(store).email, "pt@example.com");
});
