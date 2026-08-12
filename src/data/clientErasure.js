// src/data/clientErasure.js — honouring an Art. 17 erasure request without destroying the training
// record. Pure: takes a state, returns a new one. No DOM, no storage, no clock of its own.
//
// **Erasure is anonymization, not deletion** (TODO §17.3, [DATA_MODEL §5](../../docs/DATA_MODEL.md)).
// Every identifying field is replaced or cleared; the execution records — what was lifted, when, for
// how long — stay, keyed to an opaque id that no longer resolves to a person.
//
// **It is irreversible, and that is the decision §17.3 left open.** A reversible scheme needs a
// mapping from pseudonym back to person, and with no server that mapping would sit in the same local
// database it is meant to protect — one file that un-erases everyone. So nothing is kept: no name,
// no contact, no mapping table, no "recently erased" cache. The pseudonym is derived from the
// record's own id, which was already opaque (`recordId.js` — UUIDv7 base62, not derived from any
// personal data), so deriving it leaks nothing and needs no second token to store.
//
// What that buys, legally: after this runs there is no stored means of linking the remaining records
// to a person, which is the line between pseudonymised data (still personal data, Art. 4(5)) and
// anonymised data (outside the Regulation, Recital 26). What it does NOT cover, and the UI says so
// rather than implying otherwise:
//   * a PRE-ERASURE BACKUP still names them — that is what erasureSuppression.js exists for;
//   * the trainer's own memory and their paper files are outside any software's reach.
//
// Three fan-out surfaces, and missing any one of them means the erasure silently failed:
//   1. the client record itself;
//   2. `clientName`, DENORMALISED onto every history and planUpdate record (recordSchemas.js) —
//      the exact "one store keeps the name" failure DATA_MODEL §5 warns about;
//   3. trainer-typed free text that happens to contain the name (session titles, draft titles,
//      feedback notes), which no schema marks as identifying because it is prose.
//
// Injected dependencies: none.

// Fields that describe the PERSON. Cleared outright — unlike the execution data, none of them mean
// anything once the person is gone.
//
// `weightHistory` is in this list on purpose, and it is the one judgement call worth stating: body
// weight is a measurement of the human being, not of the work performed, so it goes with the name.
// Session loads stay because they describe what was lifted, not who lifted it.
const CLEARED_TEXT_FIELDS = ["email", "phone", "goals", "notes", "injury"];

// Short and stable: the trainer needs to tell two erased records apart in a list, and the full id is
// unreadable at a glance.
//
// HASHED rather than sliced, and that is not decoration. Slicing the id echoes whatever the id
// happens to contain — fine for `recordId.js`'s opaque UUIDv7s, but a record imported from another
// system can carry an id like `jane-doe-1`, and slicing it would print the erased person's name back
// onto their own anonymised record. A hash cannot leak what it does not copy, so the guarantee stops
// depending on another module's contract. Not a security boundary and deliberately not a crypto hash
// — nothing here resists an attacker who already holds the id; it exists so the label reflects
// nothing but the id's identity, and it stays synchronous, which SubtleCrypto would not.
function shortDigest(text) {
  // FNV-1a, 32-bit: tiny, dependency-free, and well-distributed enough that two clients in one
  // trainer's book collide with vanishing probability.
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(6, "0").slice(-6);
}

export function erasurePseudonym(clientId) {
  const id = String(clientId || "");
  return `Client #${id ? shortDigest(id) : "ERASED"}`;
}

export function isErased(client) {
  return Boolean(client?.erasure?.erasedAt);
}

/** The client record, with every identifying field replaced. */
export function eraseClientRecord(client, { requestedOn = "", now = new Date() } = {}) {
  const pseudonym = erasurePseudonym(client.id);
  const erased = {
    ...client,
    name: pseudonym,
    // Not initials of the pseudonym: "C" for every erased client is worse than the marker, which
    // reads correctly in the avatar circle and cannot be mistaken for a person's monogram.
    avatar: "—",
    weightHistory: [],
    hasInjury: false,
    // An erased client is not someone you train. Left in the directory rather than hidden, because
    // a trainer asked "did you action my request?" needs to be able to show that it was actioned.
    active: false,
    // An already-erased record keeps its ORIGINAL dates. Erasure is idempotent — the suppression
    // pass re-runs it on every import (erasureSuppression.js), and a restore in November must not
    // re-date an August erasure: `erasedAt` is the trainer's evidence of WHEN they complied with
    // the one-month deadline, and a moving date destroys exactly that.
    erasure: client.erasure || {
      erasedAt: now.toISOString(),
      // The date the CLIENT asked, which is what the deadline (Art. 12(3)) runs from — not the date
      // the trainer got round to it. Same distinction as consentDate vs timestamp.
      requestedOn: requestedOn || now.toISOString().substring(0, 10),
    },
  };
  for (const field of CLEARED_TEXT_FIELDS) erased[field] = "";
  // The consent block stays: it holds no identifying data (a flag, two dates, a language) and it is
  // the trainer's evidence that the processing up to the erasure was lawful (Art. 7(1)).
  return erased;
}

export function normalizedName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Other clients who answer to the same name.
 *
 * Two people called Jane Doe is not an edge case in a gym, and it is the case where a name-based
 * sweep does real damage: erasing one Jane's records must not rewrite a session title that meant
 * the OTHER Jane. Where the name is ambiguous, prose is left alone and flagged for the trainer —
 * a human can tell the two apart from context, and this cannot.
 */
export function clientsSharingName(state, client) {
  const target = normalizedName(client?.name);
  if (!target) return [];
  return (state?.clients || []).filter(
    (candidate) => candidate.id !== client.id && normalizedName(candidate.name) === target,
  );
}

/**
 * Enough detail to tell two same-named clients apart, for any UI that must ask "this one?".
 *
 * Contact details first because that is what a trainer recognises; the id tail last as the
 * tiebreaker that always exists, even for two records with the same name and no contact details at
 * all. Never returns an empty string — an unlabelled option in a destructive confirmation is how
 * the wrong person gets erased.
 */
export function clientDisambiguator(client) {
  // Alias first: it is the label the trainer chose FOR this purpose, so it beats anything derived.
  const parts = [client?.alias, client?.email, client?.phone].filter(Boolean);
  if (client?.joinedDate) parts.push(`joined ${client.joinedDate}`);
  parts.push(`id …${String(client?.id || "").slice(-6)}`);
  return parts.join(" · ");
}

// Replaces the name wherever it appears inside trainer-typed prose. Case-insensitive because
// "jane" and "Jane" are the same person, bounded by non-letters because replacing "Ana" inside
// "Banana" would corrupt unrelated text. Deliberately NOT clever: it cannot catch nicknames,
// misspellings, or "her" — so the caller reports how many fields it touched and the UI tells the
// trainer to check the rest by hand rather than implying the sweep was exhaustive.
function scrubName(text, name, pseudonym) {
  if (typeof text !== "string" || !text || !name) return { text, hit: false };
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^\\p{L}])${escaped}(?![\\p{L}])`, "giu");
  const next = text.replace(pattern, (_match, lead) => `${lead}${pseudonym}`);
  return { text: next, hit: next !== text };
}

// A history record belongs to exactly one client, so prose inside it is unambiguous EVEN when the
// name is shared — a note on Jane A's session is about Jane A. Ambiguity only reaches records that
// several clients share, which is sessions.
function eraseHistoryRecord(record, name, pseudonym, counters) {
  const feedback = Array.isArray(record.feedback)
    ? record.feedback.map((item) => {
        const scrubbed = scrubName(item?.note, name, pseudonym);
        if (scrubbed.hit) counters.scrubbedTextFields += 1;
        return { ...item, note: scrubbed.text };
      })
    : record.feedback;

  const title = scrubName(record.title, name, pseudonym);
  if (title.hit) counters.scrubbedTextFields += 1;

  return { ...record, clientName: pseudonym, title: title.text, feedback };
}

/**
 * Erase one client everywhere they appear.
 *
 * Returns a NEW state plus a summary of what was touched — the summary is not decoration: an
 * erasure a trainer cannot describe is one they cannot prove they performed when asked.
 */
export function eraseClientInState(state, clientId, { requestedOn = "", now = new Date() } = {}) {
  const client = (state?.clients || []).find((candidate) => candidate.id === clientId);
  if (!client) return { state, summary: null };

  const name = client.name || "";
  const pseudonym = erasurePseudonym(clientId);
  const namesakes = clientsSharingName(state, client);
  const counters = {
    history: 0,
    planUpdates: 0,
    sessions: 0,
    scrubbedTextFields: 0,
    // Session titles this refused to touch, and why. Surfaced, never silently skipped: an
    // untouched title still naming the erased client is the one thing a trainer must go and fix by
    // hand, and they can only do that if they are told which sessions to open.
    reviewSessionIds: [],
  };

  const clients = state.clients.map((candidate) =>
    candidate.id === clientId ? eraseClientRecord(candidate, { requestedOn, now }) : candidate,
  );

  const history = (state.history || []).map((record) => {
    if (record.clientId !== clientId) return record;
    counters.history += 1;
    return eraseHistoryRecord(record, name, pseudonym, counters);
  });

  const planUpdates = (state.planUpdates || []).map((record) => {
    if (record.clientId !== clientId) return record;
    counters.planUpdates += 1;
    return { ...record, clientName: pseudonym };
  });

  // A session keeps the participant id — the slot happened and the other participants' records
  // depend on it. Only the trainer-typed title can carry the name, and it is the one field several
  // clients share, so it is where erasing the wrong Jane Doe's data actually becomes possible.
  const sessions = (state.sessions || []).map((session) => {
    if (!Array.isArray(session.participants) || !session.participants.includes(clientId)) {
      return session;
    }
    counters.sessions += 1;

    const soleParticipant = session.participants.length === 1;
    const mentionsName = scrubName(session.title, name, pseudonym).hit;
    if (!mentionsName) return session;

    // Rewrite only when the erased client is unambiguously the person the title means: no namesake
    // in the database, and nobody else in the session. Otherwise the title stays exactly as typed
    // and is reported — a trainer reading it can tell which Jane it meant; a regex cannot, and
    // guessing here would rewrite one client's session under another client's erasure.
    if (namesakes.length > 0 || !soleParticipant) {
      counters.reviewSessionIds.push(session.id);
      return session;
    }
    const title = scrubName(session.title, name, pseudonym);
    counters.scrubbedTextFields += 1;
    return { ...session, title: title.text };
  });

  return {
    state: { ...state, clients, history, planUpdates, sessions },
    summary: {
      clientId,
      pseudonym,
      erasedAt: now.toISOString(),
      requestedOn,
      // Named in the receipt because it changes what the trainer must do next: with a namesake in
      // the book, no shared free text was rewritten and all of it needs a human pass.
      namesakes: namesakes.map((namesake) => ({
        id: namesake.id,
        label: clientDisambiguator(namesake),
      })),
      ...counters,
    },
  };
}
