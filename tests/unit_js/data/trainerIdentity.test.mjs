// tests/unit_js/data/trainerIdentity.test.mjs
// The trainer's own address, kept only so an invite has an ORGANIZER (src/data/trainerIdentity.js).

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_EXPIRY_PADDING_HOURS,
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
  // round trip is. Pinning the shape meant that adding `phone` — a real field
  // with its own tests, breaking nothing a caller can observe — failed three tests here.
  const identity = readTrainerIdentity(store);
  assert.equal(identity.name, "Sam Ray");
  assert.equal(identity.email, "pt@librept.test");
});

test("an install that has never been told reports empty strings, not null", () => {
  // The invite dialog puts these straight into an input's value; null would render as "null". Asserted
  // over every STRING-valued field rather than a hardcoded list — the settings this also returns
  // (expiryPaddingHours) have their own defaults and are pinned separately below.
  const identity = readTrainerIdentity(fakeStore());
  const textFields = Object.entries(identity).filter(([, value]) => typeof value === "string");
  assert.ok(textFields.length >= 3, "the contact fields are still strings");
  for (const [field, value] of textFields) {
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

// --- The expiry padding (TODO §1.6, asked for 2026-08-17). A setting, not a record: it belongs to the
// install the way `lang` does, and it is stamped onto each invite at send time so the cutoff can travel. ---

test("the padding a trainer sets is remembered in hours", () => {
  const store = fakeStore();

  writeTrainerIdentity({ email: "pt@librept.test", expiryPaddingHours: 4 }, store);

  assert.equal(readTrainerIdentity(store).expiryPaddingHours, 4);
});

test("a trainer who has set nothing gets the default rather than no deadline at all", () => {
  // Zero would mean "never expires", which is a different intention from "has not chosen".
  assert.equal(readTrainerIdentity(fakeStore()).expiryPaddingHours, DEFAULT_EXPIRY_PADDING_HOURS);
});

test("a trainer can turn expiry off, and that survives being read back", () => {
  const store = fakeStore();

  writeTrainerIdentity({ expiryPaddingHours: 0 }, store);

  assert.equal(readTrainerIdentity(store).expiryPaddingHours, 0, "0 is a choice, not an absence");
});

test("nonsense in the padding falls back to the default instead of producing a bogus cutoff", () => {
  const store = fakeStore();

  writeTrainerIdentity({ expiryPaddingHours: "four-ish" }, store);

  assert.equal(readTrainerIdentity(store).expiryPaddingHours, DEFAULT_EXPIRY_PADDING_HOURS);
});
