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

test("goals and injuries cannot ride along even when the sender puts them in", () => {
  // §1.7's proposal: special-category data stays out of the transport, so it cannot appear in a URL,
  // a carrier's logs, or two phones' message histories. A sender who adds it anyway is ignored.
  const signup = buildClientSignup({
    ...filledForm(),
    goals: "lose 10kg",
    injury: "knee reconstruction 2024",
    hasInjury: true,
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
