// src/data/trainerIdentity.js — who the trainer is, for the one purpose the app has ever needed it:
// being the ORGANIZER of a calendar invite so replies have somewhere to go (TODO §1.1/§1.6).
//
// **Not a profile, and deliberately not one.** LibrePT stores clients, not trainers — there is one
// trainer per install and the app has never had to name them. This is two strings kept because an
// `.ics` without an `ORGANIZER` is one no calendar client will reply to, not the start of an account
// system. If a real trainer profile ever arrives, these move into it.
//
// **A setting, not a record.** It belongs to the install the same way `lang` does, so it lives
// beside the connection flag in plain `localStorage` rather than in the record store: it is not
// something to sync, merge, migrate or export, and putting it in the schema would make it all four.
// Deliberately NOT version-scoped (unlike the setup form's draft) — a half-filled form belongs to
// the build whose form it is, but a trainer's own address has to survive every deploy.
//
// Injected dependencies: `store` (defaults to `localStorage`) so tests need no browser.

const EMAIL_KEY = "librept_trainer_email";
const NAME_KEY = "librept_trainer_name";
// The trainer's phone, kept for one reason (TODO §1.6, SMS ruled in 2026-08-17): an invite has to
// CARRY it, or the client's reply can only ever be an email — their device knows nothing about the
// trainer beyond what the invite told it. Not validated: phone numbers are written a dozen ways and
// the app never dials it, it only hands it to the client's own messaging app.
const PHONE_KEY = "librept_trainer_phone";
// How long before a session an invitation stops being answerable, in hours (TODO §1.6, asked for
// 2026-08-17). A SETTING, like the two above: it belongs to the install, is stamped onto each invite at
// send time so the cutoff can travel, and is never a per-record field. 0 means "never expires" and is a
// real choice, which is why absence and zero are told apart below.
const EXPIRY_PADDING_KEY = "librept_invite_expiry_hours";

/** What a trainer gets before setting anything. Four hours is the example the feature was asked for, and
 *  it is long enough to act on a "no" — the point of a deadline is a usable gap, not a formality.
 *
 *  Declared HERE rather than in domain/inviteExpiry.js, which does the arithmetic: `data` may not import
 *  `domain` (AGENT_RULES §5.3, and the gate says so), and this is the default value of a stored setting
 *  rather than a rule about training. The domain module takes the padding as an argument and has no
 *  opinion about where it came from. */
export const DEFAULT_EXPIRY_PADDING_HOURS = 4;

/** Good enough to catch a typo, and no more. Full RFC 5322 validation is famously not worth
 * attempting, and the cost of being wrong here is asymmetric: rejecting a trainer's real address is
 * worse than passing through one that bounces, which they will find out about immediately. */
export function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function readTrainerIdentity(store = localStorage) {
  return {
    name: store.getItem(NAME_KEY) || "",
    email: store.getItem(EMAIL_KEY) || "",
    phone: store.getItem(PHONE_KEY) || "",
    expiryPaddingHours: readExpiryPadding(store),
  };
}

/** Hours of padding, or the default when nothing has been chosen. **Absence and zero are different**:
 *  zero is a trainer saying "never expire", and returning the default for it would quietly reinstate a
 *  deadline they turned off. Anything unparseable falls back to the default rather than to 0, because a
 *  bogus value must not silently disable a feature the trainer asked for. */
function readExpiryPadding(store) {
  const stored = store.getItem(EXPIRY_PADDING_KEY);
  if (stored === null) return DEFAULT_EXPIRY_PADDING_HOURS;
  const hours = Number(stored);
  return Number.isFinite(hours) && hours >= 0 ? hours : DEFAULT_EXPIRY_PADDING_HOURS;
}

/** Stores what was given, and only what was given: a blank field clears that key rather than
 * writing an empty string, so `readTrainerIdentity` never reports an address that is not one. */
export function writeTrainerIdentity(
  { name, email, phone, expiryPaddingHours } = {},
  store = localStorage,
) {
  // Written as its own step because 0 is meaningful here and would be cleared by the blank-clears rule
  // below, which is right for a name and wrong for a number.
  if (expiryPaddingHours !== undefined) {
    const hours = Number(expiryPaddingHours);
    if (Number.isFinite(hours) && hours >= 0) store.setItem(EXPIRY_PADDING_KEY, String(hours));
    else store.setItem(EXPIRY_PADDING_KEY, String(DEFAULT_EXPIRY_PADDING_HOURS));
  }

  for (const [key, value] of [
    [NAME_KEY, name],
    [EMAIL_KEY, email],
    [PHONE_KEY, phone],
  ]) {
    const trimmed = String(value || "").trim();
    if (trimmed) {
      store.setItem(key, trimmed);
    } else {
      store.removeItem(key);
    }
  }
}
