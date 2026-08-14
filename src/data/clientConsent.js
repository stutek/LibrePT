// src/data/clientConsent.js — the state a stored GDPR consent record can be in, and the one
// transition that must not lose anything (TODO §27.4/§27.7).
//
// Single responsibility: answer "may this client's data be processed?" and "what happened, and
// when?" from the `gdprConsent` object, so the badge, the export and the form all read one rule
// rather than three that disagree.
//
// **Three states, not two, and the third is the whole point.** A client who never consented and a
// client who consented and later withdrew are legally different situations, and the record has to
// tell them apart. Art. 7(1) requires being able to DEMONSTRATE that consent was obtained — so
// withdrawal must keep the signed date, the wording version and the language it was given under,
// while stopping processing. Before this existed the only available action was unticking the box,
// which wrote `{cloudSync: false, consentDate: "", formVersion: "", formLang: ""}` and erased the
// evidence that consent had ever existed. The trainer honouring a withdrawal correctly destroyed
// their own proof of having had consent in the first place.
//
// **`cloudSync` stays the "may I process?" flag** rather than gaining a rival. Withdrawal has to
// stop processing, every existing caller already reads that field for exactly that question, and a
// second source of truth is how a withdrawn client keeps syncing because one branch was missed.
//
// **Withdrawal is not erasure.** It halts further processing; it does not by itself delete
// anything. Art. 17(1)(b) gives a *right* to erasure once consent is withdrawn and no other basis
// applies, but that is a separate request the client makes and §27.2's flow serves — and the client
// may well want their training history kept. Conflating the two deletes records nobody asked to
// lose, along with the withdrawal record itself.
//
// Injected dependencies: none — pure functions over a plain object.

/** True when consent was given and has not been withdrawn — the only state in which this client's
 * data may be processed. */
export function isConsentActive(consent) {
  return Boolean(consent?.cloudSync);
}

/** True when consent was given at some point and later withdrawn. Distinct from "never consented",
 * which carries no dates at all. */
export function isConsentWithdrawn(consent) {
  return Boolean(consent?.withdrawnDate);
}

/** True when there is nothing on file either way. */
export function hasNoConsentRecord(consent) {
  return !isConsentActive(consent) && !isConsentWithdrawn(consent);
}

/** The date the client signed, falling back to the write timestamp's date for records written
 * before the date field existed — the closest thing those records have to a consent date. */
export function consentSignedDate(consent) {
  if (!consent) return "";
  return consent.consentDate || (consent.timestamp || "").split("T")[0] || "";
}

/** Records a withdrawal, preserving everything that evidences the consent it ends.
 *
 * Returns a NEW object; the caller's record is untouched. A consent that was never given cannot be
 * withdrawn — there is nothing to stop and nothing to evidence — so it is returned unchanged rather
 * than gaining a withdrawal date that implies a consent it never had.
 */
export function withdrawConsent(consent, withdrawnDate) {
  if (!isConsentActive(consent)) return consent;
  return {
    ...consent,
    cloudSync: false,
    withdrawnDate,
  };
}
