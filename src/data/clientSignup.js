// src/data/clientSignup.js — what a client's own introduction of themselves IS (TODO §1.7/§26).
//
// Single responsibility: the submission record a prospective client produces on their own phone, and
// the sanitising read of one that arrives from somewhere else. **How it travels is deliberately not
// here** — that is a transport's job (modules/common/eventTransports.js), the seam §1.6 established
// on 2026-08-17: a new channel is then a new entry in one list rather than a new payload format.
//
// **Goals and injuries are the client's to offer, never required** (Simon, 2026-08-17: "customer
// should provide goals and injuries if they decide to do so"). They are Art. 9 health data, so two
// things hold them in place. They are optional at every level — a submission with neither is
// complete, and a blank field is absent from the record rather than stored as an empty string, so the
// trainer can tell "chose not to say" from "said nothing yet". And they travel **only inside the
// shared file** (§1.7's share transport, ruled 2026-08-17), never in a URL: a link's payload would sit
// in a carrier's logs and in two phones' message histories, which is not somewhere health data may
// rest. A transport that cannot carry them privately must not carry them at all.
//
// **The consent stamp travels with the submission, and that is the actual prize.** Art. 7(1) requires
// being able to DEMONSTRATE consent, so `formVersion` and `formLang` are captured at the moment the
// client was shown *that* wording in *that* language — not whichever version is current when the
// trainer later saves the record, and not a date the trainer typed from memory. A self-served consent
// that loses either is not evidence of anything. The stored shape is exactly
// [clientConsent.js](clientConsent.js)'s, so a self-served consent and a trainer-captured one are the
// same record and every reader already understands it.
//
// **Reading one is parsing hostile input.** Anyone who photographs a gym-wall code can craft a
// submission, so `parseClientSignup` returns null for anything it does not fully recognise and copies
// field by field — an unknown key is dropped rather than reflected onward into whatever the review
// dialog is about to write. The review dialog is the trust boundary (§26.5); this is the part of it
// that cannot be forgotten at a call site.
//
// deps: none — pure functions over plain objects.

/** Bumped only when the shape changes incompatibly. A submission may be opened weeks after it was
 *  made, by a build that has moved on: this is what lets that build recognise a record it cannot read
 *  instead of misreading it. */
export const SIGNUP_FORMAT_VERSION = 1;

// Generous enough that no honest person is near them, small enough that a crafted submission cannot
// push a megabyte of text into the DOM or into storage.
const MAX_NAME_LENGTH = 120;
const MAX_CONTACT_LENGTH = 200;
// Prose, so the cap is generous: someone describing a knee reconstruction and what they want out of
// training needs sentences. The file transport has no size budget, so nothing but sanity limits this.
const MAX_PROSE_LENGTH = 1000;

// The fields a client may state about themselves, and nothing else. Anything absent from this list is
// dropped on the way in, including a field the trainer's own client record happens to have.
const SIGNUP_TEXT_FIELDS = ["name", "email", "phone", "goals", "injury"];

function readText(value, maxLength) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return "";
  return trimmed;
}

/** The consent as the client gave it: their date, their language, the wording they were shown.
 *
 * `cloudSync` is the "may I process?" flag every existing reader already keys on, so a self-served
 * consent needs no second rule. An unticked box yields no consent record at all rather than a record
 * saying no — "did not consent yet" and "declined" are the same situation here, and inventing a
 * declined state would put a stranger's non-decision into the trainer's register.
 */
function readConsent(raw) {
  if (!raw || typeof raw !== "object" || raw.cloudSync !== true) return null;

  const consentDate = readText(raw.consentDate, 40);
  const formVersion = readText(raw.formVersion, 40);
  const formLang = readText(raw.formLang, 10);
  // All three or none. A consent missing its wording version or its language cannot evidence
  // anything under Art. 7(1), and storing it anyway would look like proof while being none.
  if (!consentDate || !formVersion || !formLang) return null;

  return { cloudSync: true, consentDate, formVersion, formLang };
}

/**
 * The submission a filled-in intake form becomes, or null when it is not one.
 *
 * Refuses without a name AND at least one way to reach the person: those two are what the trainer
 * reviewing it needs in order to recognise who this is, and email/phone is also the key §26.5's
 * dedupe and [UC4](../../use_cases/uc4_client_self_subscription.md) both reconcile on. A nameless,
 * contactless submission is a row nobody can act on.
 */
export function buildClientSignup(input) {
  const name = readText(input?.name, MAX_NAME_LENGTH);
  const email = readText(input?.email, MAX_CONTACT_LENGTH);
  const phone = readText(input?.phone, MAX_CONTACT_LENGTH);
  if (!name || (!email && !phone)) return null;

  const signup = { v: SIGNUP_FORMAT_VERSION, name };
  if (email) signup.email = email;
  if (phone) signup.phone = phone;

  // Offered, not asked for. A blank field is left OUT rather than written as "", so a trainer reading
  // the review can tell a client who chose not to say from one who has not been asked yet.
  const goals = readText(input?.goals, MAX_PROSE_LENGTH);
  const injury = readText(input?.injury, MAX_PROSE_LENGTH);
  if (goals) signup.goals = goals;
  if (injury) signup.injury = injury;

  const consent = readConsent(input?.gdprConsent);
  if (consent) signup.gdprConsent = consent;
  return signup;
}

/**
 * A submission read back from wherever it arrived, or null if it is anything else. Never throws: the
 * input is a file or a link someone sent, and every way of it being wrong is ordinary rather than
 * exceptional.
 */
export function parseClientSignup(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  if (raw.v !== SIGNUP_FORMAT_VERSION) return null;

  const input = {};
  for (const field of SIGNUP_TEXT_FIELDS) input[field] = raw[field];
  input.gdprConsent = raw.gdprConsent;
  // Rebuilt through the same constructor the client's own device used, so there is exactly one
  // definition of a valid submission rather than a builder and a validator that can drift apart.
  return buildClientSignup(input);
}

/** True when the submission carries a consent the trainer can rely on — the question the review
 *  dialog asks in order to say "signed 2026-08-17, wording 2026-08-09, in Slovenian" rather than
 *  "consent: yes". */
export function signupHasConsent(signup) {
  return Boolean(signup?.gdprConsent?.cloudSync);
}

/**
 * The submission matched against the register the trainer already has: the existing client this is
 * plainly the same person as, or null for someone new.
 *
 * Email and phone only, and both compared loosely — a client who types their number with spaces one
 * day and without them the next is one person, and a second Jane Doe in the register is a worse
 * outcome than an unmatched submission the trainer resolves by eye. **Name is deliberately not a
 * key**: gyms have two Jane Does (which is why `alias` exists in the client schema), so matching on
 * it would merge two people who share a name — a data-protection incident rather than a tidy-up.
 *
 * Phone comparison is digits only, which does NOT reconcile `+386 51 999 888` with `051 999 888`:
 * stripping a country code correctly needs to know which country, and guessing would silently merge
 * two numbers that differ. That case falls through to the trainer's own eyes in the review dialog,
 * which is the right place for it.
 */
export function findExistingClientForSignup(signup, clients = []) {
  const email = (signup?.email || "").toLowerCase();
  const phone = digitsOf(signup?.phone);

  return (
    clients.find((client) => {
      if (email && (client.email || "").trim().toLowerCase() === email) return true;
      return Boolean(phone) && digitsOf(client.phone) === phone;
    }) || null
  );
}

function digitsOf(value) {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

/**
 * The client-record fields this submission supplies — what a trainer would otherwise have typed from
 * something the person said at the desk.
 *
 * **Only what the client actually said.** A field they skipped is absent from the result, never blank,
 * because the review dialog offers "update existing" for a returning client: a mapping that filled in
 * empty strings would wipe the trainer's own notes and goals for the crime of the client leaving those
 * boxes alone.
 *
 * **`hasInjury` is DERIVED here, never carried on the wire.** The client says what happened to their
 * knee; whether the app raises its safety advisory follows from there being text at all. Taking the
 * flag from the sender would let a crafted file — or an honest mistake — produce a warning banner with
 * nothing in it.
 *
 * **Nothing that identifies a record is included**, and that is the security half: no `id`, no
 * `active`, no `erasure`. Otherwise a submission could name the record it lands on, and a stranger
 * could aim their file at an existing client.
 */
export function clientFieldsFromSignup(signup) {
  if (!signup) return {};

  const fields = { name: signup.name };
  if (signup.email) fields.email = signup.email;
  if (signup.phone) fields.phone = signup.phone;
  if (signup.goals) fields.goals = signup.goals;
  if (signup.injury) {
    fields.injury = signup.injury;
    fields.hasInjury = true;
  }
  if (signup.gdprConsent) fields.gdprConsent = { ...signup.gdprConsent };
  return fields;
}
