// tests/unit_js/modules/common/trainerDetailsDialog.test.mjs
// What the trainer's details form refuses, and what makes them complete enough for the welcome
// screen to stop asking (src/modules/common/trainerDetailsDialog.js).

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  trainerDetailsComplete,
  trainerDetailsProblems,
} from "../../../../src/modules/common/trainerDetailsDialog.js";

const COMPLETE = {
  firstName: "Ana",
  lastName: "Kovač",
  phone: "+386 40 123 456",
  email: "ana@librept.test",
};

test("four filled, well-formed fields have no problem", () => {
  assert.deepEqual(trainerDetailsProblems(COMPLETE), {});
  assert.equal(trainerDetailsComplete(COMPLETE), true);
});

test("every field is required", () => {
  for (const field of Object.keys(COMPLETE)) {
    const problems = trainerDetailsProblems({ ...COMPLETE, [field]: "   " });
    assert.equal(problems[field], "required", `${field} left blank`);
  }
  assert.equal(trainerDetailsComplete({}), false);
});

test("a phone must have enough digits to be dialled, however it is written", () => {
  assert.equal(trainerDetailsProblems({ ...COMPLETE, phone: "040" }).phone, "phone");
  assert.equal(trainerDetailsProblems({ ...COMPLETE, phone: "(040) 123-456" }).phone, undefined);
});

test("an email that is not an address is refused", () => {
  assert.equal(trainerDetailsProblems({ ...COMPLETE, email: "ana@" }).email, "email");
});

test("an install that stored only one name is not complete", () => {
  // It is asked once to split the name into first and last.
  assert.equal(
    trainerDetailsComplete({ name: "Ana Kovač", phone: COMPLETE.phone, email: COMPLETE.email }),
    false,
  );
});
