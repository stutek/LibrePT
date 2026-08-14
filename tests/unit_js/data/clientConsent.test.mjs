// tests/unit_js/data/clientConsent.test.mjs
// Consent state and the withdrawal transition (TODO §27.7, src/data/clientConsent.js).
//
// The promise under test is legal, not cosmetic: Art. 7(3) says withdrawal must be as easy as
// consent, and Art. 7(1) says the controller must still be able to DEMONSTRATE that consent was
// obtained. Those pull in opposite directions — the easy action is unticking a box, and the naive
// implementation of that erases the very evidence Art. 7(1) asks for. Every test here is about
// keeping both true at once.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  consentSignedDate,
  hasNoConsentRecord,
  isConsentActive,
  isConsentWithdrawn,
  withdrawConsent,
} from "../../../src/data/clientConsent.js";

const GIVEN = {
  cloudSync: true,
  consentDate: "2026-05-04",
  formVersion: "2026-08-09",
  formLang: "sl",
  timestamp: "2026-05-04T09:12:00.000Z",
};

test("a signed, un-withdrawn consent permits processing", () => {
  assert.equal(isConsentActive(GIVEN), true);
  assert.equal(isConsentWithdrawn(GIVEN), false);
  assert.equal(hasNoConsentRecord(GIVEN), false);
});

test("no consent record at all is distinct from a withdrawn one", () => {
  for (const nothing of [null, undefined, {}, { cloudSync: false }]) {
    assert.equal(isConsentActive(nothing), false);
    assert.equal(isConsentWithdrawn(nothing), false);
    assert.equal(hasNoConsentRecord(nothing), true);
  }
});

test("withdrawal stops processing", () => {
  // Every existing caller reads cloudSync to decide whether it may act, so withdrawal has to move
  // that flag rather than adding a rival one some branch would miss.
  const withdrawn = withdrawConsent(GIVEN, "2026-08-14");
  assert.equal(isConsentActive(withdrawn), false);
});

test("withdrawal keeps the evidence that consent was given (Art. 7(1))", () => {
  // The whole point. Before this, honouring a withdrawal wrote consentDate/formVersion/formLang
  // blank, so a trainer doing the right thing destroyed their own proof of ever having consent.
  const withdrawn = withdrawConsent(GIVEN, "2026-08-14");
  assert.equal(withdrawn.consentDate, GIVEN.consentDate);
  assert.equal(withdrawn.formVersion, GIVEN.formVersion, "which wording was signed must survive");
  assert.equal(withdrawn.formLang, GIVEN.formLang);
  assert.equal(withdrawn.withdrawnDate, "2026-08-14");
  assert.equal(isConsentWithdrawn(withdrawn), true);
});

test("withdrawing does not mutate the stored record", () => {
  const record = { ...GIVEN };
  withdrawConsent(record, "2026-08-14");
  assert.deepEqual(record, GIVEN, "the caller's record must be left alone");
});

test("a consent that was never given cannot be withdrawn", () => {
  // A withdrawal date on a client who never consented would assert a consent that never existed —
  // worse than silence, because it reads as evidence.
  for (const nothing of [null, undefined, {}, { cloudSync: false }]) {
    const result = withdrawConsent(nothing, "2026-08-14");
    assert.equal(isConsentWithdrawn(result), false);
  }
});

test("withdrawing twice keeps the first date", () => {
  // The date that matters is when processing had to stop, not when someone last opened the dialog.
  const once = withdrawConsent(GIVEN, "2026-08-14");
  const twice = withdrawConsent(once, "2026-09-01");
  assert.equal(twice.withdrawnDate, "2026-08-14");
});

test("the signed date falls back to the write timestamp for older records", () => {
  // Records written before the date field existed carry only the ISO write time; its date part is
  // the closest thing they have to a consent date, and beats showing nothing.
  assert.equal(
    consentSignedDate({ cloudSync: true, timestamp: "2026-05-04T09:12:00.000Z" }),
    "2026-05-04",
  );
  assert.equal(consentSignedDate(GIVEN), "2026-05-04", "an explicit date always wins");
  assert.equal(consentSignedDate(null), "");
});
