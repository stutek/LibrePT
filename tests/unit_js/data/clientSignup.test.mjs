// tests/unit_js/data/clientSignup.test.mjs
// A prospective client introducing themselves (src/data/clientSignup.js) — TODO §1.7/§26.
//
// Two promises are being pinned. To the CLIENT: what they ticked, in the language they read it, on the
// date they ticked it, survives the trip intact — that is the whole Art. 7(1) value of them doing it
// themselves rather than the trainer typing a date afterwards. To the TRAINER: a submission is
// hostile input (anyone who photographs a gym-wall code can craft one), so nothing arrives in their
// register that this module did not recognise field by field.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildClientSignup,
  clientFieldsFromSignup,
  findExistingClientForSignup,
  parseClientSignup,
  signupHasConsent,
} from "../../../src/data/clientSignup.js";

const CONSENT = {
  cloudSync: true,
  consentDate: "2026-08-17",
  formVersion: "2026-08-09",
  formLang: "sl",
};

const filledForm = (overrides = {}) => ({
  name: "Jana Novak",
  email: "jana@example.com",
  phone: "041 234 567",
  gdprConsent: CONSENT,
  ...overrides,
});

test("what the client ticked survives the trip: their date, their language, that wording", () => {
  const signup = buildClientSignup(filledForm());

  // A persisted shape, and deliberately the same one a trainer-captured consent has — so every
  // existing reader of gdprConsent understands a self-served one without learning a second rule.
  assert.deepEqual(signup.gdprConsent, CONSENT);
  assert.equal(signupHasConsent(signup), true);
});

test("a consent missing its wording version or language is refused rather than stored as proof", () => {
  for (const missing of ["formVersion", "formLang", "consentDate"]) {
    const consent = { ...CONSENT };
    delete consent[missing];

    const signup = buildClientSignup(filledForm({ gdprConsent: consent }));

    assert.equal(signupHasConsent(signup), false, `${missing} missing should carry no consent`);
    assert.equal(signup.name, "Jana Novak", "the rest of the submission is still usable");
  }
});

test("an unticked box produces no consent record at all, not a record saying no", () => {
  const signup = buildClientSignup(filledForm({ gdprConsent: { ...CONSENT, cloudSync: false } }));

  assert.equal("gdprConsent" in signup, false);
});

test("a submission needs a name and one way to reach the person", () => {
  assert.equal(buildClientSignup(filledForm({ name: "  " })), null);
  assert.equal(buildClientSignup(filledForm({ email: "", phone: "" })), null);
  // Either contact alone is enough — plenty of clients give one and not the other.
  assert.ok(buildClientSignup(filledForm({ email: "" })));
  assert.ok(buildClientSignup(filledForm({ phone: "" })));
});

test("goals and an injury travel when the client offers them", () => {
  // Ruled 2026-08-17: the client provides these if they decide to. They are Art. 9 data, which is why
  // they may only ride in the shared FILE and never in a link — see the module header.
  const signup = buildClientSignup({
    ...filledForm(),
    goals: "back to squatting after the knee",
    injury: "knee reconstruction 2024",
  });

  assert.equal(signup.goals, "back to squatting after the knee");
  assert.equal(signup.injury, "knee reconstruction 2024");
});

test("saying nothing about health is a complete submission, and reads as a choice", () => {
  const silent = buildClientSignup(filledForm());
  const blank = buildClientSignup({ ...filledForm(), goals: "   ", injury: "" });

  // Absent, not "" — so the trainer can tell "chose not to say" from a field nobody has filled yet.
  for (const signup of [silent, blank]) {
    assert.equal("goals" in signup, false);
    assert.equal("injury" in signup, false);
    assert.ok(signup.name, "the submission is still valid and usable");
  }
});

test("nothing outside the declared fields rides along, however the sender labels it", () => {
  const signup = buildClientSignup({
    ...filledForm(),
    hasInjury: true,
    medications: "insulin",
    notes: "trainer-only field",
  });

  assert.deepEqual(Object.keys(signup).sort(), ["email", "gdprConsent", "name", "phone", "v"]);
});

test("a round trip through the parser is the same submission", () => {
  const signup = buildClientSignup(filledForm());

  assert.deepEqual(parseClientSignup(structuredClone(signup)), signup);
});

test("a submission from a build that has moved on is refused, not misread", () => {
  const fromTheFuture = { ...buildClientSignup(filledForm()), v: 99 };

  assert.equal(parseClientSignup(fromTheFuture), null);
});

test("a page of prose is refused rather than truncated into something plausible", () => {
  // Truncating would store a sentence that stops mid-clause and reads as the client's own words —
  // worse than refusing, when the field describes an injury a trainer will program around.
  const signup = buildClientSignup({ ...filledForm(), injury: "x".repeat(1001) });

  assert.equal("injury" in signup, false);
  assert.ok(signup.name, "the rest of the submission still arrives");
});

test("nothing the sender invents reaches the trainer's register", () => {
  const crafted = {
    ...buildClientSignup(filledForm()),
    id: "existing-client-id",
    active: true,
    erasure: { erasedAt: "" },
    __proto__: { polluted: true },
  };

  const parsed = parseClientSignup(crafted);

  assert.deepEqual(Object.keys(parsed).sort(), ["email", "gdprConsent", "name", "phone", "v"]);
  assert.equal("polluted" in parsed, false);
  assert.equal({}.polluted, undefined, "the prototype chain is untouched");
});

test("absurd input is refused rather than trimmed into something plausible", () => {
  assert.equal(parseClientSignup(null), null);
  assert.equal(parseClientSignup("not an object"), null);
  assert.equal(parseClientSignup([buildClientSignup(filledForm())]), null);
  assert.equal(buildClientSignup(filledForm({ name: "x".repeat(500) })), null);
  assert.equal(buildClientSignup(filledForm({ name: { toString: () => "Jana" } })), null);
});

test("a returning client is recognised, and two different people are never merged", () => {
  const register = [
    { id: "c1", name: "Jana Novak", email: "Jana@Example.com", phone: "041234567" },
    { id: "c2", name: "Jana Novak", email: "other@example.com", phone: "051999888" },
  ];

  // Same email, different case — one person.
  assert.equal(findExistingClientForSignup(buildClientSignup(filledForm()), register).id, "c1");

  // Same phone written differently — still one person.
  const byPhone = buildClientSignup(filledForm({ email: "", phone: "+386 51 999 888" }));
  assert.equal(findExistingClientForSignup(byPhone, register)?.id, undefined);
  const localPhone = buildClientSignup(filledForm({ email: "", phone: "051 999 888" }));
  assert.equal(findExistingClientForSignup(localPhone, register).id, "c2");

  // A THIRD Jana Novak with her own contact details is a new person, not either of the two above —
  // matching on the name would merge two clients, which is an incident rather than a tidy-up.
  const namesake = buildClientSignup(filledForm({ email: "third@example.com", phone: "" }));
  assert.equal(findExistingClientForSignup(namesake, register), null);
});

test("a submission becomes the client record fields a trainer would have typed", () => {
  const signup = buildClientSignup(
    filledForm({ goals: "back to squatting", injury: "knee reconstruction 2024" }),
  );

  const fields = clientFieldsFromSignup(signup);

  assert.equal(fields.name, "Jana Novak");
  assert.equal(fields.email, "jana@example.com");
  assert.equal(fields.goals, "back to squatting");
  assert.equal(fields.injury, "knee reconstruction 2024");
  // hasInjury is DERIVED, never taken from the sender: the client says what happened to their knee,
  // and whether the app shows a safety advisory follows from there being text at all. A sender who
  // set the flag with no text would otherwise raise a warning banner with nothing in it.
  assert.equal(fields.hasInjury, true);
  assert.deepEqual(fields.gdprConsent, signup.gdprConsent);
});

test("what the client did not say leaves the trainer's own fields alone", () => {
  // The dialog offers "update existing" for a returning client, so this mapping must not overwrite a
  // trainer's notes and goals with blanks just because the client skipped those boxes.
  const fields = clientFieldsFromSignup(buildClientSignup(filledForm()));

  assert.equal("goals" in fields, false);
  assert.equal("injury" in fields, false);
  assert.equal("hasInjury" in fields, false);
});

test("nothing that identifies a record comes from the submission", () => {
  // A crafted file must not be able to name the record it lands on, or a stranger could aim their
  // submission at an existing client and overwrite them.
  const fields = clientFieldsFromSignup(
    parseClientSignup({ ...buildClientSignup(filledForm()), id: "c1", active: false }),
  );

  assert.equal("id" in fields, false);
  assert.equal("active" in fields, false);
});
